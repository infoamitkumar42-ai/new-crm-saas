const { createClient } = require('@supabase/supabase-js');
const s = createClient('https://vewqzsqddgmkslnuctvb.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDUzMDQ2MiwiZXhwIjoyMDgwMTA2NDYyfQ.pAgMGN6MtKm1A3fsKr1GIt8-qmKYhwFjSt92L_6_7us');

(async () => {
    try {
        const { data: triggers, error } = await s.rpc('exec_sql', {
            sql_query: "SELECT tgname, pg_get_triggerdef(t.oid) as definition FROM pg_trigger t JOIN pg_class c ON c.oid = t.tgrelid JOIN pg_namespace n ON n.nspname = 'public' WHERE c.relname = 'users'"
        });

        if (error) {
            console.error('Error:', error);
        } else {
            console.log('Triggers:', JSON.stringify(triggers, null, 2));
        }
    } catch (e) {
        console.error('Fatal error:', e);
    }
})();
