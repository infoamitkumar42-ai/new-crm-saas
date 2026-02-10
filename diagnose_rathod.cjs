const { createClient } = require('@supabase/supabase-js');

// HARDCODED CREDENTIALS
const SUPABASE_URL = 'https://vewqzsqddgmkslnuctvb.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDUzMDQ2MiwiZXhwIjoyMDgwMTA2NDYyfQ.pAgMGN6MtKm1A3fsKr1GIt8-qmKYhwFjSt92L_6_7us';
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const email = 'rathoddevanshi774@gmail.com';

async function diagnoseUser() {
    console.log(`🔍 DIAGNOSING USER: ${email}\n`);

    // 1. Get User Details
    const { data: user, error: uErr } = await supabase.from('users').select('*').eq('email', email).single();

    if (uErr || !user) {
        console.log(`❌ ERROR: User not found in DB.`);
        return;
    }

    console.log('--- User Info ---');
    console.log(`Name: ${user.name}`);
    console.log(`ID: ${user.id}`);
    console.log(`Is Active: ${user.is_active}`);
    console.log(`Plan Name: ${user.plan_name}`);
    console.log(`Payment Status: ${user.payment_status}`);
    console.log(`Daily Limit: ${user.daily_limit}`);
    console.log(`Leads Today: ${user.leads_today}`);
    console.log(`Total Leads Received: ${user.total_leads_received}`);
    console.log(`Total Leads Promised: ${user.total_leads_promised}`);
    console.log(`Target State: ${user.target_state}`);
    console.log(`Is Plan Pending: ${user.is_plan_pending}`);

    // 2. Check Payments
    console.log('\n--- Payment Records ---');
    const { data: payments } = await supabase.from('payments').select('*').eq('user_id', user.id).order('created_at', { ascending: false });
    if (payments && payments.length > 0) {
        payments.forEach(p => {
            console.log(`- Date: ${p.created_at} | Amount: ${p.amount} | Status: ${p.status}`);
        });
    } else {
        console.log('No payment records found.');
    }

    // 3. Check Chirag's Team
    console.log('\n--- Manager Info ---');
    if (user.manager_id) {
        const { data: mgr } = await supabase.from('users').select('name, email').eq('id', user.manager_id).single();
        console.log(`Manager: ${mgr?.name || 'Unknown'} (${mgr?.email})`);
    } else {
        console.log('No manager assigned.');
    }

    // 4. Recommendation Logic
    console.log('\n--- diagnosis ---');
    if (!user.is_active) console.log('🛑 User is INACTIVE.');
    if (user.daily_limit === 0) console.log('🛑 Daily Limit is 0.');
    if (user.leads_today >= user.daily_limit && user.daily_limit > 0) console.log('✅ Daily Limit reached for today.');
    if (user.is_plan_pending) console.log('⚠️ Plan is still marked as PENDING.');
}

diagnoseUser();
