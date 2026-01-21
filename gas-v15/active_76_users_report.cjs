
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://vewqzsqddgmkslnuctvb.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDUzMDQ2MiwiZXhwIjoyMDgwMTA2NDYyfQ.pAgMGN6MtKm1A3fsKr1GIt8-qmKYhwFjSt92L_6_7us';
const supabase = createClient(supabaseUrl, supabaseKey);

async function getActiveUsersLeads() {
    console.log("📊 ACTIVE 76 USERS - PLAN LEADS REPORT\n");
    console.log("=".repeat(80));

    // Get only users with active plans (daily_limit > 0)
    const { data: users, error } = await supabase
        .from('users')
        .select('id, name, email, plan_name, plan_start_date, valid_until, daily_limit')
        .eq('is_active', true)
        .gt('daily_limit', 0)
        .order('name');

    if (error) { console.error("Err:", error); return; }

    console.log(`| #  | Name                 | Plan        | Leads (Plan) | Valid Until |`);
    console.log("-".repeat(80));

    let totalLeads = 0;
    let count = 0;

    for (const u of users) {
        // Count leads since plan_start_date
        let query = supabase
            .from('leads')
            .select('*', { count: 'exact', head: true })
            .eq('assigned_to', u.id);

        if (u.plan_start_date) {
            query = query.gte('assigned_at', u.plan_start_date);
        }

        const { count: leadCount } = await query;
        const leads = leadCount || 0;
        totalLeads += leads;
        count++;

        const validDate = u.valid_until ? new Date(u.valid_until).toLocaleDateString('en-GB') : 'N/A';

        console.log(`| ${String(count).padStart(2)} | ${u.name.padEnd(20)} | ${(u.plan_name || 'N/A').padEnd(11)} | ${String(leads).padEnd(12)} | ${validDate} |`);
    }

    console.log("-".repeat(80));
    console.log(`\n📈 SUMMARY (76 Active Users Only):`);
    console.log(`   Total Active Users:   ${users.length}`);
    console.log(`   Total Leads Assigned: ${totalLeads}`);
    console.log("=".repeat(80));
}

getActiveUsersLeads();
