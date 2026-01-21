
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://vewqzsqddgmkslnuctvb.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDUzMDQ2MiwiZXhwIjoyMDgwMTA2NDYyfQ.pAgMGN6MtKm1A3fsKr1GIt8-qmKYhwFjSt92L_6_7us';
const supabase = createClient(supabaseUrl, supabaseKey);

async function generateReport() {
    console.log("📊 Generating Pending Users Data...\n");

    const { data: users, error } = await supabase
        .from('users')
        .select('id, name, leads_today, daily_limit')
        .eq('is_active', true);

    if (error) { console.error("Err:", error); return; }

    // Filter: Pending Users (leads < limit) AND Limit > 0
    const pendingUsers = users.filter(u => u.daily_limit > 0 && u.leads_today < u.daily_limit);

    // Sort by Leads Assigned (High to Low) as requested ("maximum kitni leads gyi hai")
    pendingUsers.sort((a, b) => b.leads_today - a.leads_today);

    console.log(`📋 PENDING USERS REPORT (${pendingUsers.length} Users Waiting):`);
    console.log(`---------------------------------------------------------------`);
    console.log(`| Name                 | Assigned | Limit | REMAINING |`);
    console.log(`---------------------------------------------------------------`);

    let totalPending = 0;

    pendingUsers.forEach(u => {
        const remaining = u.daily_limit - u.leads_today;
        totalPending += remaining;

        console.log(`| ${u.name.padEnd(20)} | ${String(u.leads_today).padEnd(8)} | ${String(u.daily_limit).padEnd(5)} | 🚨 ${remaining}`);
    });

    console.log(`---------------------------------------------------------------`);
    console.log(`📉 TOTAL REMAINING QUOTA: ${totalPending} Leads Needed`);
    console.log(`👥 Total Users Waiting:   ${pendingUsers.length}`);
}

generateReport();
