const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://vewqzsqddgmkslnuctvb.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDUzMDQ2MiwiZXhwIjoyMDgwMTA2NDYyfQ.pAgMGN6MtKm1A3fsKr1GIt8-qmKYhwFjSt92L_6_7us';
const supabase = createClient(supabaseUrl, supabaseKey);

const emails = [
    'ravenjeetkaur@gmail.com', 'vansh.rajni.96@gmail.com', 'payalpuri3299@gmail.com',
    'princyrani303@gmail.com', 'aansh8588@gmail.com', 'nitinanku628@gmail.com',
    'saijelgoel4@gmail.com', 'navpreetkaur95271@gmail.com', 'officialrajinderdhillon@gmail.com',
    'prince@gmail.com', 'jaspreetkaursarao45@gmail.com', 'rupanasameer551@gmail.com',
    'ludhranimohit91@gmail.com', 'goldymahi27@gmail.com', 'amritpalkaursohi358@gmail.com',
    'surjitsingh1067@gmail.com', 'mandeepbrar1325@gmail.com', 'jk419473@gmail.com',
    'punjabivinita@gmail.com', 'ajayk783382@gmail.com', 'samandeepkaur1216@gmail.com',
    'rohitgagneja69@gmail.com', 'ziana4383@gmail.com', 'loveleenkaur8285@gmail.com'
];

(async () => {
    console.log('--- 🚀 AUDITING BOOSTER HIERARCHY ---');

    const { data: users, error: userError } = await supabase
        .from('users')
        .select('name, email, manager_id, team_code, is_active')
        .in('email', emails);

    if (userError) {
        console.error('User Error:', userError);
        return;
    }

    const managerIds = [...new Set(users.map(u => u.manager_id).filter(Boolean))];
    const { data: managers, error: mgrError } = await supabase
        .from('users')
        .select('id, name, email')
        .in('id', managerIds);

    if (mgrError) {
        console.error('Manager Error:', mgrError);
        return;
    }

    const managerMap = Object.fromEntries(managers.map(m => [m.id, m]));

    console.log('\nBooster Distribution:');
    const tableData = users.map(u => ({
        Name: u.name,
        Email: u.email,
        Team: u.team_code,
        Manager: managerMap[u.manager_id]?.name || 'Unknown',
        MgrEmail: managerMap[u.manager_id]?.email || 'N/A'
    }));

    console.table(tableData);

    const breakdown = {};
    tableData.forEach(row => {
        const mgr = row.Manager;
        breakdown[mgr] = (breakdown[mgr] || 0) + 1;
    });

    console.log('\nBreakdown by Manager:');
    console.table(breakdown);

})();
