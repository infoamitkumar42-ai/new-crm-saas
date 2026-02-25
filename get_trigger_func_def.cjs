const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://vewqzsqddgmkslnuctvb.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDUzMDQ2MiwiZXhwIjoyMDgwMTA2NDYyfQ.pAgMGN6MtKm1A3fsKr1GIt8-qmKYhwFjSt92L_6_7us';
const supabase = createClient(supabaseUrl, supabaseKey);

(async () => {
    // Find the trigger and its function
    const { data: triggers, error: triggerError } = await supabase.rpc('exec_sql', {
        sql_query: "SELECT trigger_name, action_statement FROM information_schema.triggers WHERE trigger_name = 'check_lead_limit_before_insert';"
    });

    if (triggerError) {
        console.error('Trigger Error:', triggerError);
        return;
    }

    console.log('--- TRIGGER ---');
    console.table(triggers);

    // Fetch all function definitions that might match
    const { data: funcs, error: funcError } = await supabase.rpc('exec_sql', {
        sql_query: "SELECT routine_name, routine_definition FROM information_schema.routines WHERE routine_name ILIKE '%check_lead_limit%' AND routine_schema = 'public';"
    });

    if (funcError) {
        console.error('Function Error:', funcError);
        return;
    }

    funcs.forEach(f => {
        console.log(`--- FUNCTION: ${f.routine_name} ---`);
        console.log(f.routine_definition);
    });
})();
