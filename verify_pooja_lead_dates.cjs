const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = "https://vewqzsqddgmkslnuctvb.supabase.co";
const SUPABASE_SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDUzMDQ2MiwiZXhwIjoyMDgwMTA2NDYyfQ.pAgMGN6MtKm1A3fsKr1GIt8-qmKYhwFjSt92L_6_7us";

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function verifyPoojaDates() {
    console.log("📅 ANALYZING POOJA'S LEAD DATES...");
    const email = 'jollypooja5@gmail.com';

    // 1. Get User ID
    const { data: user } = await supabase.from('users').select('id').eq('email', email).single();
    if (!user) return;

    // 2. Fetch all leads assigned to her
    const { data: leads } = await supabase
        .from('leads')
        .select('created_at, name')
        .eq('assigned_to', user.id);

    if (!leads || leads.length === 0) {
        console.log("No leads found.");
        return;
    }

    console.log(`📊 Total Leads: ${leads.length}`);

    // 3. Group by Date
    const dateCounts = {};
    leads.forEach(l => {
        // Convert UTC to IST roughly or just use UTC date part
        const date = new Date(l.created_at).toISOString().split('T')[0];
        dateCounts[date] = (dateCounts[date] || 0) + 1;
    });

    console.log("\n📅 Date-wise Breakdown (UTC):");
    let janCount = 0;
    let febCount = 0;

    Object.keys(dateCounts).sort().forEach(date => {
        console.log(`   - ${date}: ${dateCounts[date]} Leads`);
        if (date.startsWith('2026-01')) janCount += dateCounts[date];
        if (date.startsWith('2026-02')) febCount += dateCounts[date];
    });

    console.log("\n🧐 CONCLUSION:");
    console.log(`   - January Data: ${janCount}`);
    console.log(`   - February Data: ${febCount}`);

    if (janCount > 0 && febCount === 0) {
        console.log("⚠️ CONFIRMED: All leads are from January.");
    } else if (janCount > 0 && febCount > 0) {
        console.log("ℹ️ MIXED: Some old Jan data, some Feb.");
    } else {
        console.log("ℹ️ FRESH: All leads are from February.");
    }

    // Check strict timestamp clustering (did they come in the same second?)
    // Analyze the first 10 leads to see seconds
    const timestamps = leads.map(l => new Date(l.created_at).getTime());
    const minTime = Math.min(...timestamps);
    const maxTime = Math.max(...timestamps);
    const diffSeconds = (maxTime - minTime) / 1000;

    console.log(`\n⏱️ Time Spread: All ${leads.length} leads arrived within ${diffSeconds.toFixed(1)} seconds.`);
    if (diffSeconds < 60) {
        console.log("🚀 BULK DUMP DETECTED: Leads came in all at once!");
    }
}

verifyPoojaDates();
