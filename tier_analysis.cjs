
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://vewqzsqddgmkslnuctvb.supabase.co';
const SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDUzMDQ2MiwiZXhwIjoyMDgwMTA2NDYyfQ.pAgMGN6MtKm1A3fsKr1GIt8-qmKYhwFjSt92L_6_7us";

const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

async function analyzeTiers() {
    console.log("⚖️ HIMANSHU TEAM: TIER-WISE LEAD DISTRIBUTION ANALYSIS (Feb 5)\n");

    const { data: users } = await supabase.from('users')
        .select('name, plan_name, daily_limit, leads_today')
        .eq('team_code', 'TEAMFIRE')
        .eq('is_active', true)
        .gt('daily_limit', 0)
        .order('leads_today', { ascending: false });

    if (!users) return console.log("No active users found.");

    // Simple Mapping if plan_name is missing or varied
    // We assume: > 10 limit = TOP, 8-10 = MID, < 8 = LOW
    const Tiers = {
        'TOP (Turbo/14)': { users: 0, leads: 0, avg: 0, list: [] },
        'MID (Weekly/8-12)': { users: 0, leads: 0, avg: 0, list: [] },
        'LOW (Starter/5)': { users: 0, leads: 0, avg: 0, list: [] }
    };

    users.forEach(u => {
        let category = 'LOW (Starter/5)';
        if (u.daily_limit >= 14) category = 'TOP (Turbo/14)';
        else if (u.daily_limit >= 8) category = 'MID (Weekly/8-12)';

        Tiers[category].users++;
        Tiers[category].leads += u.leads_today;
        Tiers[category].list.push(u.leads_today);
    });

    console.table(Object.entries(Tiers).map(([tier, data]) => {
        const avg = data.users > 0 ? (data.leads / data.users).toFixed(2) : 0;
        const max = Math.max(...data.list);
        const min = Math.min(...data.list);

        return {
            Tier: tier,
            'Active Users': data.users,
            'Total Leads Given': data.leads,
            'Avg Leads/User': avg,
            'Range (Min-Max)': `${min} - ${max}`
        };
    }));

    console.log("\n🕵️‍♂️ DETAILED OBSERVATION:");
    console.log("Check if 'Avg Leads/User' is significantly higher for TOP tier.");

    // Check Top vs Low
    const topAvg = parseFloat(Tiers['TOP (Turbo/14)'].leads / Tiers['TOP (Turbo/14)'].users);
    const lowAvg = parseFloat(Tiers['LOW (Starter/5)'].leads / Tiers['LOW (Starter/5)'].users);

    if (topAvg <= lowAvg) {
        console.log(`\n🚨 UNFAIR DISTRIBUTION DETECTED!`);
        console.log(`   Top Tier users (paying more) are getting SAME or LESS leads (${topAvg}) than Low Tier (${lowAvg}).`);
        console.log(`   Suggestion: We need to implement Weighted Round Robin.`);
    } else {
        console.log(`\n✅ DISTRIBUTION LOOKS FAIR.`);
        console.log(`   Top Tier users are getting more leads on average (${topAvg} vs ${lowAvg}).`);
    }
}

analyzeTiers();
