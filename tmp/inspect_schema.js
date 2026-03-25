import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://vewqzsqddgmkslnuctvb.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDUzMDQ2MiwiZXhwIjoyMDgwMTA2NDYyfQ.pAgMGN6MtKm1A3fsKr1GIt8-qmKYhwFjSt92L_6_7us';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function inspectSchema() {
    console.log('--- LEADS TABLE COLUMNS ---');
    // We can't query information_schema.columns directly via REST API easily.
    // But we can fetch one lead and check keys.
    const { data: lead } = await supabase.from('leads').select('*').limit(1).single();
    if (lead) {
        console.log(Object.keys(lead).join(', '));
    }

    console.log('\n--- LIST ALL TABLES ---');
    // Using an RPC if it exists, or common system table check if possible.
    // REST API doesn't list tables easily, but we can try common names.
    const tablesToCheck = ['leads', 'users', 'payments', 'webhook_errors', 'meta_pages', 'lead_queue', 'manual_assignments', 'lead_distribution', 'replacements', 'audit_logs'];
    for (const t of tablesToCheck) {
        const { data, error } = await supabase.from(t).select('*', { count: 'exact', head: true }).limit(0);
        if (!error) {
            const { count } = await supabase.from(t).select('*', { count: 'exact', head: true });
            console.log(`Table ${t}: EXISTS (count: ${count})`);
        } else {
            console.log(`Table ${t}: NOT ACCESSIBLE (${error.message})`);
        }
    }
}

inspectSchema().catch(console.error);
