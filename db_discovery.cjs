const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://vewqzsqddgmkslnuctvb.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDUzMDQ2MiwiZXhwIjoyMDgwMTA2NDYyfQ.pAgMGN6MtKm1A3fsKr1GIt8-qmKYhwFjSt92L_6_7us';
const supabase = createClient(supabaseUrl, supabaseKey);

(async () => {
    // Attempt to use a common "raw sql" RPC if it exists
    // We'll try common names: exec_sql, run_sql, sql
    const sql = `
        SELECT 
            trg.tgname AS trigger_name,
            p.proname AS function_name,
            p.prosrc AS definition
        FROM pg_trigger trg
        JOIN pg_proc p ON trg.tgfoid = p.oid
        JOIN pg_class rel ON trg.tgrelid = rel.oid
        WHERE rel.relname = 'leads'
    `;

    // Try multiple RPC names
    const rpcNames = ['exec_sql', 'execute_sql', 'run_sql'];
    let found = false;

    for (const name of rpcNames) {
        console.log(`Trying RPC: ${name}...`);
        const { data, error } = await supabase.rpc(name, { sql_query: sql });
        if (!error && data) {
            console.log(`✅ Success with RPC: ${name}`);
            console.table(data);
            found = true;
            break;
        } else {
            console.log(`❌ Failed with ${name}: ${error?.message || 'No data'}`);
        }
    }

    if (!found) {
        console.log('No SQL execution RPC found. Trying direct function discovery...');
        // Let's try to discover available RPCs
        const { data: functions, error } = await supabase
            .from('pg_proc')
            .select('proname')
            .limit(10);

        if (error) console.log('Cannot even list functions:', error.message);
    }
})();
