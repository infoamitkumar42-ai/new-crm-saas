const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = "https://vewqzsqddgmkslnuctvb.supabase.co";
const SUPABASE_SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDUzMDQ2MiwiZXhwIjoyMDgwMTA2NDYyfQ.pAgMGN6MtKm1A3fsKr1GIt8-qmKYhwFjSt92L_6_7us";

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function checkTeam() {
    console.log("📊 CHECKING TEAMFIRE DISTRIBUTION (Sorted by Total Leads)...");

    // 1. Get all TEAMFIRE users
    const { data: users } = await supabase
        .from('users')
        .select('id, name, email, daily_limit, total_leads_received')
        .eq('team_code', 'TEAMFIRE')
        .eq('is_active', true);

    // 2. Get today's leads count for each
    const { data: leads } = await supabase
        .from('leads')
        .select('assigned_to')
        .gte('created_at', new Date().toISOString().split('T')[0]);

    const stats = {};
    users.forEach(u => {
        stats[u.id] = {
            name: u.name,
            email: u.email,
            leads_today: 0,
            daily_limit: u.daily_limit,
            total: u.total_leads_received
        };
    });

    if (leads) {
        leads.forEach(l => {
            if (stats[l.assigned_to]) {
                stats[l.assigned_to].leads_today++;
            }
        });
    }

    // 3. Sort by Total Leads ASC (Fairness Logic)
    const sorted = Object.values(stats).sort((a, b) => a.total - b.total);

    // Print Top 10 (Lowest Total Leads)
    console.table(sorted.slice(0, 15));

    // Find our specific user
    const target = sorted.find(u => u.email === 'sejalrani72@gmail.com');
    if (target) {
        console.log("\n🎯 TARGET USER STATS:");
        console.log(target);
    } else {
        console.log("\n❌ Target user not found in Active TEAMFIRE list.");
    }
}

checkTeam();
