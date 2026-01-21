
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL) process.exit(1);

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function verifyAssignments() {
    console.log('🕵️ Checking Himanshu Assignments (Last 30 mins)...');

    // 1. Get Himanshu ID
    const { data: user } = await supabase.from('users').select('id, name, leads_today').eq('name', 'Himanshu Sharma').eq('is_active', true).single();

    if (!user) { console.log('❌ Himanshu Not Found'); return; }

    console.log(`👤 User: ${user.name} (ID: ${user.id}) | Counter: ${user.leads_today}`);

    // 2. Fetch Actual Leads
    const { data: leads, error } = await supabase
        .from('leads')
        .select('id, name, phone, status, assigned_at')
        .eq('user_id', user.id)
        .order('assigned_at', { ascending: false })
        .limit(10);

    if (error) {
        console.error('❌ DB Error:', error);
    } else {
        if (leads.length === 0) {
            console.log('❌ NO LEADS FOUND in DB for this User ID!');
            console.log('⚠️ Critical: Counter is up, but Rows are missing.');
        } else {
            console.log('✅ Found Leads:');
            leads.forEach(l => console.log(`   - ${l.name} (${l.phone}) | Status: ${l.status} | Time: ${l.assigned_at}`));
        }
    }
}

verifyAssignments();
