
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://vewqzsqddgmkslnuctvb.supabase.co';
const SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDUzMDQ2MiwiZXhwIjoyMDgwMTA2NDYyfQ.pAgMGN6MtKm1A3fsKr1GIt8-qmKYhwFjSt92L_6_7us";

const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

async function checkStuckLeads() {
    console.log("🕵️‍♂️ Checking for STUCK (New) Leads...");

    // 1. Get Leads with status 'New' created today (or last 24h)
    // We look at 'New' status.
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const { data: leads, error } = await supabase
        .from('leads')
        .select('id, name, phone, city, source, created_at')
        .eq('status', 'New')
        .gte('created_at', startOfDay.toISOString());

    if (error) {
        console.error("❌ Error fetching leads:", error);
        return;
    }

    if (!leads || leads.length === 0) {
        console.log("✅ No stuck leads found! All clean.");
        return;
    }

    console.log(`⚠️ FOUND ${leads.length} STUCK LEADS!`);

    // Group by Source
    const sourceMap = {};
    leads.forEach(l => {
        const s = l.source || 'Unknown';
        if (!sourceMap[s]) sourceMap[s] = 0;
        sourceMap[s]++;
    });

    console.log("\n📊 Stuck Leads by Source:");
    console.table(sourceMap);

    // 2. Suggest Assignment Targets
    // We check which teams handle these sources
    const teamsToCheck = new Set();
    Object.keys(sourceMap).forEach(s => {
        const lower = s.toLowerCase();
        if (lower.includes('rajwinder')) teamsToCheck.add('TEAMRAJ');
        else if (lower.includes('chirag') || lower.includes('bhumit')) teamsToCheck.add('GJ01TEAMFIRE');
        else teamsToCheck.add('TEAMFIRE'); // Default/Himanshu
    });

    console.log(`\n🎯 Searching for Active Users in Teams: ${Array.from(teamsToCheck).join(', ')}...`);

    for (const team of teamsToCheck) {
        const { data: users } = await supabase
            .from('users')
            .select('name, leads_today, daily_limit')
            .eq('team_code', team)
            .eq('is_active', true)
            .lt('leads_today', 60) // Simple filter to show capable users
            .order('leads_today', { ascending: true })
            .limit(5);

        if (users && users.length > 0) {
            console.log(`\n👤 Available Users in ${team} (Top 5):`);
            console.table(users);
        } else {
            console.log(`\n❌ No available users found for ${team} (or all full).`);
        }
    }
}

checkStuckLeads();
