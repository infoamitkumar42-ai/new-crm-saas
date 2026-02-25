const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = "https://vewqzsqddgmkslnuctvb.supabase.co";
const SUPABASE_SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDUzMDQ2MiwiZXhwIjoyMDgwMTA2NDYyfQ.pAgMGN6MtKm1A3fsKr1GIt8-qmKYhwFjSt92L_6_7us";

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function verifyDuplication() {
    console.log("🕵️ VERIFYING LEAD FRESHNESS FOR POOJA...");
    const email = 'jollypooja5@gmail.com';

    // 1. Get User ID
    const { data: user } = await supabase.from('users').select('id').eq('email', email).single();
    if (!user) return;

    // 2. Get Pooja's Leads
    const { data: poojaLeads } = await supabase
        .from('leads')
        .select('phone, created_at')
        .eq('assigned_to', user.id);

    if (!poojaLeads || poojaLeads.length === 0) {
        console.log("No leads to check.");
        return;
    }

    const phones = poojaLeads.map(l => l.phone).filter(p => p); // Valid phones only
    console.log(`📊 Checking ${phones.length} Phone Numbers for duplicates...`);

    // 3. Find Matches in ALL Leads (assigned to OTHERS)
    // We fetch all leads with these phone numbers
    const { data: duplicates } = await supabase
        .from('leads')
        .select('phone, assigned_to, created_at, users(name)')
        .in('phone', phones)
        .neq('assigned_to', user.id); // Not Pooja

    if (!duplicates || duplicates.length === 0) {
        console.log("✅ RESULT: 100% FRESH LEADS.");
        console.log("   No other user has leads with these phone numbers.");
    } else {
        console.log(`⚠️ RESULT: FOUND ${duplicates.length} DUPLICATE MATCHES.`);

        // Analyze details
        const uniquePhones = new Set(duplicates.map(d => d.phone));
        console.log(`   - ${uniquePhones.size} unique phone numbers were already handled by others.`);

        console.log("\n📝 Sample Duplicates:");
        duplicates.slice(0, 5).forEach(d => {
            console.log(`   - Phone ${d.phone} was also with ${d.users?.name || 'Unknown'} (Date: ${new Date(d.created_at).toLocaleDateString()})`);
        });

        const poojaDate = new Date(poojaLeads[0].created_at);
        const dupeDate = new Date(duplicates[0].created_at);

        console.log("\n🕰️ Timing Analysis:");
        if (dupeDate < poojaDate) {
            console.log("   👉 These leads were OLD/USED data (assigned to others BEFORE Pooja).");
        } else {
            console.log("   👉 These leads were assigned simultaneously.");
        }
    }
}

verifyDuplication();
