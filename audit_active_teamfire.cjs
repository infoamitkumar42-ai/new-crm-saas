const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://vewqzsqddgmkslnuctvb.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDUzMDQ2MiwiZXhwIjoyMDgwMTA2NDYyfQ.pAgMGN6MtKm1A3fsKr1GIt8-qmKYhwFjSt92L_6_7us';
const supabase = createClient(supabaseUrl, supabaseKey);

(async () => {
    const { data, error } = await supabase
        .from('users')
        .select('name, email, is_active, team_code, role')
        .eq('team_code', 'TEAMFIRE')
        .eq('is_active', true);

    if (error) {
        console.error('Error:', error);
        return;
    }

    console.log(`Summary: Total ${data.length} active users in TEAMFIRE`);
    data.forEach(u => {
        console.log(` - ${u.name} (${u.email}) | Role: ${u.role}`);
    });
})();
