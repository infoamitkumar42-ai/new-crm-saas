const { createClient } = require('@supabase/supabase-js');
const s = createClient('https://vewqzsqddgmkslnuctvb.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDUzMDQ2MiwiZXhwIjoyMDgwMTA2NDYyfQ.pAgMGN6MtKm1A3fsKr1GIt8-qmKYhwFjSt92L_6_7us');

(async () => {
    try {
        // Since exec_sql might be broken or changed, we try a direct query on pg_proc if we have any working row-returning RPC
        // Let's first just try to list function names
        const { data, error } = await s.rpc('exec_sql', { sql_query: "SELECT proname FROM pg_proc JOIN pg_namespace n ON n.oid = pronamespace WHERE n.nspname = 'public'" });

        if (error) {
            console.error('exec_sql failed, trying execute_sql...');
            const { data: d2, error: e2 } = await s.rpc('execute_sql', { sql: "SELECT 1" });
            if (e2) console.error('execute_sql failed too.');
            else console.log('execute_sql is available!');
        } else {
            console.log('Available Functions:', data.map(f => f.proname));
        }
    } catch (e) {
        console.error('Fatal:', e);
    }
})();
