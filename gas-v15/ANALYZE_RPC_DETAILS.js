import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://vewqzsqddgmkslnuctvb.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDUzMDQ2MiwiZXhwIjoyMDgwMTA2NDYyfQ.pAgMGN6MtKm1A3fsKr1GIt8-qmKYhwFjSt92L_6_7us';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function analyzeRpcErrors() {
    console.log('🔍 ANALYZING RPC ERRORS IN DETAIL...\n');

    const { data: errors, error } = await supabase
        .from('webhook_errors')
        .select('*')
        .eq('error_type', 'RPC_ERROR')
        .order('created_at', { ascending: false })
        .limit(10);

    if (error) {
        console.error('❌ Error:', error.message);
        return;
    }

    if (!errors || errors.length === 0) {
        console.log('✅ No RPC errors found!');
        return;
    }

    console.log(`📊 Found ${errors.length} RPC errors:\n`);

    errors.forEach((e, i) => {
        console.log(`\n${i + 1}. [${e.created_at}]`);
        console.log(`   Details:`, JSON.stringify(e.error_details, null, 2));
    });
}

analyzeRpcErrors().catch(console.error);
