
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL) process.exit(1);

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function verifyHimanshuRows() {
    console.log('🕵️ Verifying Actual Lead Rows for Himanshu (Today)...');

    // 1. Get Himanshu ID
    const { data: user } = await supabase
        .from('users')
        .select('id, name, leads_today')
        .eq('name', 'Himanshu Sharma')
        .eq('is_active', true)
        .single();

    if (!user) {
        console.log('❌ Himanshu User Not Found');
        return;
    }

    console.log(`👤 User: ${user.name} | leads_today (in User Table): ${user.leads_today}`);

    // 2. Count Rows in LEADS table
    const todayStr = new Date().toISOString().split('T')[0];

    const { count, error } = await supabase
        .from('leads')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('status', 'Assigned')
        .gte('created_at', todayStr);

    if (error) console.error('❌ Error counting leads:', error);
    else {
        console.log(`📝 Actual 'Assigned' Rows in LEADS table (Today): ${count}`);
    }

    // 3. Check Recent Discrepancies
    if (user.leads_today !== count) {
        console.log(`⚠️ MISMATCH DETECTED: User Table says ${user.leads_today}, but Found ${count} Rows.`);
    } else {
        console.log(`✅ MATCH: User Table (${user.leads_today}) matches Lead Rows (${count}).`);
    }
}

verifyHimanshuRows();
