const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://vewqzsqddgmkslnuctvb.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDUzMDQ2MiwiZXhwIjoyMDgwMTA2NDYyfQ.pAgMGN6MtKm1A3fsKr1GIt8-qmKYhwFjSt92L_6_7us';
const supabase = createClient(supabaseUrl, supabaseKey);

(async () => {
    const { data, error } = await supabase.rpc('exec_sql', {
        sql_query: "SELECT routine_name, routine_definition FROM information_schema.routines WHERE routine_name IN ('assign_lead_atomically', 'get_best_assignee_for_team') AND routine_schema = 'public';"
    });

    if (error) {
        console.error('Error:', error);
        return;
    }

    data.forEach(r => {
        console.log(`--- ${r.routine_name} ---`);
        console.log(r.routine_definition);
        console.log('\n');
    });
})();
