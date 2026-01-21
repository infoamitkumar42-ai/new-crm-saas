
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://vewqzsqddgmkslnuctvb.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDUzMDQ2MiwiZXhwIjoyMDgwMTA2NDYyfQ.pAgMGN6MtKm1A3fsKr1GIt8-qmKYhwFjSt92L_6_7us';
const supabase = createClient(supabaseUrl, supabaseKey);

async function getAllUsersLeads() {
    console.log("📊 COMPLETE USER LEADS REPORT (Since Plan Start)\n");
    console.log("=".repeat(90));

    // Get ALL users
    const { data: users, error } = await supabase
        .from('users')
        .select('id, name, email, plan_name, plan_start_date, valid_until, daily_limit')
        .eq('is_active', true)
        .order('name');

    if (error) { console.error("Err:", error); return; }

    console.log(`| #  | Name                 | Email                        | Plan       | Leads | Valid Until |`);
    console.log("-".repeat(100));

    let totalLeads = 0;
    let count = 0;

    for (const u of users) {
        // Count leads since plan_start_date (or all if no start date)
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
        const email = (u.email || 'N/A').substring(0, 28);

        console.log(`| ${String(count).padStart(2)} | ${u.name.padEnd(20)} | ${email.padEnd(28)} | ${(u.plan_name || 'N/A').padEnd(10)} | ${String(leads).padEnd(5)} | ${validDate} |`);
    }

    console.log("-".repeat(100));
    console.log(`\n📈 TOTAL: ${users.length} Users | ${totalLeads} Leads Assigned`);
}

getAllUsersLeads();
