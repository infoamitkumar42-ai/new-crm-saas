
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://vewqzsqddgmkslnuctvb.supabase.co';
const SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDUzMDQ2MiwiZXhwIjoyMDgwMTA2NDYyfQ.pAgMGN6MtKm1A3fsKr1GIt8-qmKYhwFjSt92L_6_7us";

const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

async function realityCheck() {
    console.log("🕵️‍♂️ REALITY CHECK: Counting every lead assigned to Chirag Team TODAY...");

    const today = new Date().toISOString().split('T')[0];

    // 1. Get Chirag Team Users
    const { data: users } = await supabase.from('users')
        .select('id, name, leads_today')
        .eq('team_code', 'GJ01TEAMFIRE');

    const ids = users.map(u => u.id);

    // 2. Count from Leads Table (THE TRUTH)
    const { data: leads, error } = await supabase.from('leads')
        .select('id, assigned_to, source')
        .in('assigned_to', ids)
        .gte('created_at', today + 'T00:00:00');

    if (error) return console.error(error);

    console.log(`\n✅ ACTUAL LEADS IN SYSTEM FOR CHIRAG TODAY: ${leads.length}`);

    const sourceBreakdown = {};
    leads.forEach(l => {
        sourceBreakdown[l.source] = (sourceBreakdown[l.source] || 0) + 1;
    });

    console.log("\nSource-wise Distribution:");
    Object.entries(sourceBreakdown).forEach(([s, c]) => console.log(`- ${s.padEnd(30)}: ${c} Leads`));

    // 3. Compare with User Table Counters
    const userCounterTotal = users.reduce((sum, u) => sum + u.leads_today, 0);
    console.log(`\n⚠️ DASHBOARD COUNTERS (User Table): ${userCounterTotal}`);

    if (leads.length > userCounterTotal) {
        console.log(`\n🚨 ALERT: Dashboard counters are laggy! Syncing them now...`);
        // Syncing Logic
        for (const u of users) {
            const actualCount = leads.filter(l => l.assigned_to === u.id).length;
            if (actualCount !== u.leads_today) {
                await supabase.from('users').update({ leads_today: actualCount }).eq('id', u.id);
            }
        }
        console.log("✅ SYNC COMPLETE. Counters are now accurate.");
    }
}

realityCheck();
