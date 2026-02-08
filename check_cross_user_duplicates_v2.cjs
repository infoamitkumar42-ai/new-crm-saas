
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://vewqzsqddgmkslnuctvb.supabase.co';
const SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDUzMDQ2MiwiZXhwIjoyMDgwMTA2NDYyfQ.pAgMGN6MtKm1A3fsKr1GIt8-qmKYhwFjSt92L_6_7us";

const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

async function checkDuplicates() {
    console.log("🕵️ CHECKING FOR DUPLICATE LEAD ASSIGNMENT (IDs)...");

    const { data: leads, error } = await supabase
        .from('leads')
        .select('name, phone, assigned_to')
        .gte('created_at', '2026-02-05T00:00:00+05:30');

    if (error) { console.error(error); return; }

    const phoneMap = {};
    const dups = [];

    leads.forEach(l => {
        if (!l.phone) return;
        const ph = l.phone.trim();

        if (!phoneMap[ph]) { phoneMap[ph] = []; }

        // Add {id}
        phoneMap[ph].push(l.assigned_to);
    });

    for (const [phone, owners] of Object.entries(phoneMap)) {
        const uniqueOwners = [...new Set(owners)].filter(id => id !== null);

        if (uniqueOwners.length > 1) {
            dups.push({ phone, count: uniqueOwners.length, owners: uniqueOwners });
        }
    }

    if (dups.length === 0) {
        console.log("✅ NO Cross-User Duplicates found (Based on IDs).");
    } else {
        console.log(`⚠️ FOUND ${dups.length} PHONES ASSIGNED TO MULTIPLE USERS!`);
        // Fetch Names for first few
        // ...
        for (const d of dups.slice(0, 10)) {
            console.log(`   📞 ${d.phone} -> Shared by ${d.count} Users`);
        }
    }
}
checkDuplicates();
