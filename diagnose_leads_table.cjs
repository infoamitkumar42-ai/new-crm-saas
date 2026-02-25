const { createClient } = require('@supabase/supabase-js');
const s = createClient('https://vewqzsqddgmkslnuctvb.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDUzMDQ2MiwiZXhwIjoyMDgwMTA2NDYyfQ.pAgMGN6MtKm1A3fsKr1GIt8-qmKYhwFjSt92L_6_7us');

(async () => {
    try {
        console.log('--- LEADS TABLE COLUMNS ---');
        const { data: cols } = await s.rpc('exec_sql', { sql_query: "SELECT column_name, data_type, is_nullable FROM information_schema.columns WHERE table_name = 'leads'" });
        console.log(JSON.stringify(cols, null, 2));

        console.log('\n--- LEADS TABLE CONSTRAINTS ---');
        const { data: consts } = await s.rpc('exec_sql', { sql_query: "SELECT conname, pg_get_constraintdef(oid) FROM pg_constraint WHERE conrelid = 'leads'::regclass" });
        console.log(JSON.stringify(consts, null, 2));

        console.log('\n--- LEADS TABLE TRIGGERS ---');
        const { data: triggers } = await s.rpc('exec_sql', { sql_query: "SELECT tgname, pg_get_triggerdef(oid) FROM pg_trigger WHERE tgrelid = 'leads'::regclass AND tgenabled = 'O'" });
        console.log(JSON.stringify(triggers, null, 2));

        console.log('\n--- ASSIGN_LEAD_ATOMICALLY DEF ---');
        const { data: func } = await s.rpc('exec_sql', { sql_query: "SELECT pg_get_functiondef(oid) FROM pg_proc WHERE proname = 'assign_lead_atomically'" });
        console.log(func?.[0]?.pg_get_functiondef);

        console.log('\n--- RECENT LEADS (LAST 20) ---');
        const { data: leads } = await s.from('leads').select('name, status, notes, assigned_to, user_id, created_at').order('created_at', { ascending: false }).limit(20);
        console.log(JSON.stringify(leads, null, 2));
    } catch (err) {
        console.error('Error:', err.message);
    }
})();
