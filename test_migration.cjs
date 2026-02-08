const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://vewqzsqddgmkslnuctvb.supabase.co';
const SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczNDI3NzIyNiwiZXhwIjoyMDQ5ODUzMjI2fQ.LST6o4OQV55yp73knkZ5MlFH-2xXJjv0NlqCVzyyqTY";

const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

async function runMigration() {
    console.log('🚀 Running migration via RPC...');

    // Test the RPC function
    const { data, error } = await supabase.rpc('get_best_assignee_for_team', {
        p_team_code: 'TEAMFIRE'
    });

    if (error) {
        console.log('❌ RPC not found or error:', error.message);
        console.log('\n⚠️ Please run the SQL migration manually in Supabase Dashboard:');
        console.log('   1. Go to SQL Editor');
        console.log('   2. Paste contents of: supabase/migrations/20260207010000_fix_assignment_logic.sql');
        console.log('   3. Click Run');
    } else {
        console.log('✅ RPC function exists and working!');
        console.log('Result:', data);
    }

    // Check if webhook_errors table exists
    const { data: tables, error: tableError } = await supabase
        .from('webhook_errors')
        .select('id')
        .limit(1);

    if (tableError && tableError.code === '42P01') {
        console.log('❌ webhook_errors table does not exist');
    } else {
        console.log('✅ webhook_errors table exists');
    }
}

runMigration();
