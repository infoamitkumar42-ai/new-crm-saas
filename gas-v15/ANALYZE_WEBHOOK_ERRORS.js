import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://vewqzsqddgmkslnuctvb.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDUzMDQ2MiwiZXhwIjoyMDgwMTA2NDYyfQ.pAgMGN6MtKm1A3fsKr1GIt8-qmKYhwFjSt92L_6_7us';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function analyzeErrors() {
    console.log('🔍 ANALYZING WEBHOOK ERRORS...\n');

    const { data: errors, error } = await supabase
        .from('webhook_errors')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(20);

    if (error) {
        console.error('❌ Error fetching webhook errors:', error.message);
        return;
    }

    if (!errors || errors.length === 0) {
        console.log('✅ No recent webhook errors found!');
        return;
    }

    console.log(`📊 Found ${errors.length} recent errors:\n`);

    // Group by error type
    const errorTypes = {};
    errors.forEach(e => {
        const type = e.error_type || 'UNKNOWN';
        if (!errorTypes[type]) {
            errorTypes[type] = [];
        }
        errorTypes[type].push(e);
    });

    Object.entries(errorTypes).forEach(([type, errs]) => {
        console.log(`\n🔴 ${type} (${errs.length} occurrences)`);
        console.log('   Latest:', errs[0].created_at);
        if (errs[0].error_details) {
            console.log('   Details:', JSON.stringify(errs[0].error_details).substring(0, 100));
        }
    });

    console.log('\n\n📝 Latest 5 Errors:');
    errors.slice(0, 5).forEach((e, i) => {
        console.log(`\n${i + 1}. [${e.created_at}] ${e.error_type}`);
        if (e.error_details) {
            console.log(`   ${JSON.stringify(e.error_details).substring(0, 150)}`);
        }
    });
}

analyzeErrors().catch(console.error);
