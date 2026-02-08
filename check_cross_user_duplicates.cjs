
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://vewqzsqddgmkslnuctvb.supabase.co';
const SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDUzMDQ2MiwiZXhwIjoyMDgwMTA2NDYyfQ.pAgMGN6MtKm1A3fsKr1GIt8-qmKYhwFjSt92L_6_7us";

const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

async function checkDuplicates() {
    console.log("🕵️ CHECKING FOR DUPLICATE LEAD ASSIGNMENT (Same Phone -> Multiple Users)...");

    // 1. Find Duplicate Phones using RPC is best, but I'll use raw JS to group if list size permits (1000 limit).
    // Better: Filter by current window leads first? Or Check ALL?
    // User asked generally.
    // I will check the recently distributed leads first (Where duplication is suspected).

    // Fetch all leads created recently
    const { data: leads, error } = await supabase
        .from('leads')
        .select('name, phone, assigned_to, users(name)')
        .gte('created_at', '2026-02-05T00:00:00+05:30');

    if (error) { console.error(error); return; }

    const phoneMap = {};
    const dups = [];

    leads.forEach(l => {
        if (!l.phone) return;

        // Normalize phone? Remove spaces?
        const ph = l.phone.trim();

        if (!phoneMap[ph]) {
            phoneMap[ph] = [];
        }
        phoneMap[ph].push({
            name: l.name,
            owner: l.users ? l.users.name : 'Unknown'
        });
    });

    for (const [phone, owners] of Object.entries(phoneMap)) {
        if (owners.length > 1) {
            // Check if owners are DIFFERENT
            const ownerNames = owners.map(o => o.owner);
            const uniqueOwners = [...new Set(ownerNames)];

            if (uniqueOwners.length > 1) {
                dups.push({ phone, owners: uniqueOwners });
            }
        }
    }

    if (dups.length === 0) {
        console.log("✅ NO Cross-User Duplicates found in Recent Leads.");
    } else {
        console.log(`⚠️ FOUND ${dups.length} DUPLICATES assigned to different users!`);
        dups.forEach(d => {
            console.log(`   📞 ${d.phone} -> Shared by: ${d.owners.join(', ')}`);
        });
    }
}

checkDuplicates();
