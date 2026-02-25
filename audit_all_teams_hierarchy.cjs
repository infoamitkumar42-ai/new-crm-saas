const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://vewqzsqddgmkslnuctvb.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDUzMDQ2MiwiZXhwIjoyMDgwMTA2NDYyfQ.pAgMGN6MtKm1A3fsKr1GIt8-qmKYhwFjSt92L_6_7us';
const supabase = createClient(supabaseUrl, supabaseKey);

(async () => {
    console.log('--- 🚀 AUDITING ALL ACTIVE TEAM MEMBERS ---');

    const { data: users, error } = await supabase
        .from('users')
        .select('name, email, team_code, manager_id, is_active')
        .eq('is_active', true)
        .in('team_code', ['TEAMFIRE', 'GJ01TEAMFIRE']);

    if (error) {
        console.error(error);
        return;
    }

    const managerIds = [...new Set(users.map(u => u.manager_id).filter(Boolean))];
    const { data: managers } = await supabase.from('users').select('id, name').in('id', managerIds);
    const managerMap = Object.fromEntries(managers.map(m => [m.id, m.name]));

    const tableData = users.map(u => ({
        Name: u.name,
        Email: u.email,
        Team: u.team_code,
        Manager: managerMap[u.manager_id] || 'Unknown'
    }));

    console.log('\nActive Members:');
    console.table(tableData);

    const teamBreakdown = {};
    tableData.forEach(row => {
        const key = `${row.Team} (${row.Manager})`;
        teamBreakdown[key] = (teamBreakdown[key] || 0) + 1;
    });

    console.log('\nBreakdown by Team & Manager:');
    console.table(teamBreakdown);
})();
