const { createClient } = require('@supabase/supabase-js');
const supabase = createClient('https://vewqzsqddgmkslnuctvb.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDUzMDQ2MiwiZXhwIjoyMDgwMTA2NDYyfQ.pAgMGN6MtKm1A3fsKr1GIt8-qmKYhwFjSt92L_6_7us');

async function main() {
    console.log("🔄 SYNCING leads_today COUNTER FOR ALL ACTIVE TEAMFIRE USERS\n");

    const { data: activeUsers } = await supabase.from('users')
        .select('id, name, email, leads_today')
        .eq('team_code', 'TEAMFIRE')
        .eq('is_active', true)
        .order('name');

    let fixed = 0;
    for (const u of (activeUsers || [])) {
        // Count actual leads assigned today (IST)
        const { count: actualToday } = await supabase.from('leads')
            .select('*', { count: 'exact', head: true })
            .eq('assigned_to', u.id)
            .gte('created_at', '2026-02-22T18:30:00Z'); // Today Feb 23 IST start

        if ((u.leads_today || 0) !== (actualToday || 0)) {
            await supabase.from('users').update({ leads_today: actualToday || 0 }).eq('id', u.id);
            console.log(`✅ ${u.name}: ${u.leads_today || 0} -> ${actualToday || 0}`);
            fixed++;
        }
    }

    console.log(`\n🔄 Synced ${fixed} users' leads_today counters.`);
    console.log("✅ DONE! Dashboard should now show correct numbers.");
}

main().catch(console.error);
