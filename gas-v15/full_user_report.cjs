
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://vewqzsqddgmkslnuctvb.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDUzMDQ2MiwiZXhwIjoyMDgwMTA2NDYyfQ.pAgMGN6MtKm1A3fsKr1GIt8-qmKYhwFjSt92L_6_7us';
const supabase = createClient(supabaseUrl, supabaseKey);

async function generateFullReport() {
    console.log("📊 FULL USER DISTRIBUTION REPORT\n");

    const { data: users, error } = await supabase
        .from('users')
        .select('id, name, leads_today, daily_limit')
        .eq('is_active', true)
        .gt('daily_limit', 0)
        .order('leads_today', { ascending: false });

    if (error) { console.error("Err:", error); return; }

    console.log(`| # | Name                 | Assigned | Limit | Status     |`);
    console.log(`|---|----------------------|----------|-------|------------|`);

    let totalAssigned = 0;
    let totalLimit = 0;
    let fullCount = 0;
    let pendingCount = 0;

    users.forEach((u, i) => {
        const assigned = u.leads_today || 0;
        const limit = u.daily_limit || 0;
        totalAssigned += assigned;
        totalLimit += limit;

        let status = '';
        if (assigned >= limit) {
            status = '✅ FULL';
            fullCount++;
        } else {
            status = `🚨 -${limit - assigned}`;
            pendingCount++;
        }

        console.log(`| ${String(i + 1).padStart(2)} | ${u.name.padEnd(20)} | ${String(assigned).padEnd(8)} | ${String(limit).padEnd(5)} | ${status.padEnd(10)} |`);
    });

    console.log(`|---|----------------------|----------|-------|------------|`);
    console.log(`\n📈 SUMMARY:`);
    console.log(`   Total Users:     ${users.length}`);
    console.log(`   Full (100%):     ${fullCount}`);
    console.log(`   Pending:         ${pendingCount}`);
    console.log(`   Total Assigned:  ${totalAssigned} / ${totalLimit} (${Math.round(totalAssigned / totalLimit * 100)}%)`);
}

generateFullReport();
