
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL) process.exit(1);

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function verifyAssignmentsByID() {
    const TARGET_ID = '79c67296-b221-4ca9-a3a5-1611e690e68d'; // Himanshu Active ID
    console.log(`🕵️ Checking Assignments for ID: ${TARGET_ID}`);

    // 1. Get User Details
    const { data: user } = await supabase.from('users').select('*').eq('id', TARGET_ID).single();
    if (!user) console.log('❌ User ID Not Found');
    else console.log(`👤 User: ${user.name} | Counter: ${user.leads_today}`);

    // 2. Fetch Actual Leads
    const { data: leads, error } = await supabase
        .from('leads')
        .select('id, name, phone, status, assigned_at')
        .eq('user_id', TARGET_ID)
        .order('assigned_at', { ascending: false })
        .limit(10);

    if (error) {
        console.error('❌ DB Error:', error);
    } else {
        if (leads.length === 0) {
            console.log('❌ NO LEADS FOUND assigned to this ID!');
        } else {
            console.log('✅ Found Leads:');
            leads.forEach(l => console.log(`   - ${l.name} | Status: ${l.status} | Assigned: ${l.assigned_at}`));
        }
    }
}

verifyAssignmentsByID();
