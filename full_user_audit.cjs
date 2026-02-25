const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://vewqzsqddgmkslnuctvb.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDUzMDQ2MiwiZXhwIjoyMDgwMTA2NDYyfQ.pAgMGN6MtKm1A3fsKr1GIt8-qmKYhwFjSt92L_6_7us';
const supabase = createClient(supabaseUrl, supabaseKey);

(async () => {
    console.log('--- 🚀 FULL USER AUDIT ---');

    const { data: users, error } = await supabase
        .from('users')
        .select('name, email, team_code, manager_id, is_active')
        .eq('is_active', true);

    if (error) {
        console.error(error);
        return;
    }

    const managerIds = [...new Set(users.map(u => u.manager_id).filter(Boolean))];
    const { data: managers } = await supabase.from('users').select('id, name, email').in('id', managerIds);
    const managerMap = Object.fromEntries(managers.map(m => [m.id, m]));

    const report = users.map(u => ({
        Name: u.name,
        Email: u.email,
        Team: u.team_code,
        Manager: managerMap[u.manager_id]?.name || 'No Manager',
        MgrEmail: managerMap[u.manager_id]?.email || ''
    }));

    // Output only Himanshu and Chirag related people for clarity
    const filtered = report.filter(r =>
        r.Team === 'TEAMFIRE' || r.Team === 'GJ01TEAMFIRE' || r.Manager.includes('Himanshu') || r.Manager.includes('Chirag')
    );

    console.log(JSON.stringify(filtered, null, 2));
})();
