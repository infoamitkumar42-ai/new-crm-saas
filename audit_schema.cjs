const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://vewqzsqddgmkslnuctvb.supabase.co';
const SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczNDI3NzIyNiwiZXhwIjoyMDQ5ODUzMjI2fQ.LST6o4OQV55yp73knkZ5MlFH-2xXJjv0NlqCVzyyqTY";

const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

async function auditSchema() {
    console.log('📊 USERS TABLE SCHEMA AUDIT\n');

    // Get one user to see all columns
    const { data: user, error } = await supabase
        .from('users')
        .select('*')
        .limit(1)
        .single();

    if (error) {
        console.log('Error:', error.message);
        return;
    }

    console.log('Available Columns:');
    console.log('==================');

    const quotaColumns = [
        'plan_total_leads',
        'total_leads_assigned',
        'replacement_credits',
        'daily_limit',
        'leads_today',
        'plan_name',
        'valid_until',
        'is_active'
    ];

    for (const col of quotaColumns) {
        const value = user[col];
        const exists = col in user;
        console.log(`${exists ? '✅' : '❌'} ${col}: ${exists ? value : 'NOT FOUND'}`);
    }

    console.log('\n📋 Full User Sample:');
    console.log(JSON.stringify(user, null, 2));
}

auditSchema();
