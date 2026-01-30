const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://vewqzsqddgmkslnuctvb.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDUzMDQ2MiwiZXhwIjoyMDgwMTA2NDYyfQ.pAgMGN6MtKm1A3fsKr1GIt8-qmKYhwFjSt92L_6_7us';
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function checkExpiringFirstPayment() {
    console.log('🔍 CHECKING FOR USERS COMPLETING 1ST PLAN (Ending Today/Recently)...');

    // 1. Get All Users
    const { data: users, error } = await supabase
        .from('users')
        .select('id, name, email, daily_limit, leads_today')
        .eq('is_active', true);

    if (error) { console.error(error); return; }

    console.log('\n--- Possible Expiring First-Time Users ---');
    console.log('%-20s | %-10s | %-10s | %-8s | %s', 'Name', 'Plan', 'TotalLeads', 'Delivered', 'Status');
    console.log('-----------------------------------------------------------------------');

    let expiringFound = 0;

    for (const u of users) {
        // 2. Fetch payments manually for each user (since join failed)
        const { data: payments } = await supabase
            .from('manager_payments') // Trying probable table name
            .select('*')
            .eq('user_id', u.id)
            .in('status', ['captured', 'success']);

        // If manager_payments fails or empty, try 'payments' (but we can't join easily if relationship broken)
        // Let's assume standard 'payments' table exists but relationship key missing in Supabase UI def
        // We will try fetching from 'payments' directly by user_id

        let userPayments = payments || [];
        if (userPayments.length === 0) {
            const { data: p2 } = await supabase.from('payments').select('*').eq('user_id', u.id).in('status', ['captured', 'success']);
            if (p2) userPayments = p2;
        }

        // "1st Payment Wala" -> Exactly 1 payment
        if (userPayments.length !== 1) continue;

        const payment = userPayments[0];
        let totalLeadsFromPlan = 0;

        // Determine Plan Details
        const amt = payment.amount;
        if (amt >= 990 && amt <= 1000) totalLeadsFromPlan = 50;      // Starter
        else if (amt >= 1990 && amt <= 2000) totalLeadsFromPlan = 105; // Supervisor
        else if (amt >= 2990 && amt <= 3000) totalLeadsFromPlan = 160; // Manager
        else totalLeadsFromPlan = 50; // default

        // Calculate Leads Delivered Total
        const { count: deliveredCount } = await supabase
            .from('leads')
            .select('*', { count: 'exact', head: true })
            .eq('assigned_to', u.id);

        const remaining = totalLeadsFromPlan - (deliveredCount || 0);

        // Alert if remaining is low (e.g. less than 2 days of leads)
        // Or if valid leads are close to total

        if (remaining <= (u.daily_limit || 5) * 2) {
            console.log(`%-20s | %-10s | %-10d | %-8d | ⚠️ Ends Soon/Done (${remaining} left)`,
                u.name.substring(0, 20),
                payment.plan_name || (amt < 1500 ? 'Starter' : 'Pro'),
                totalLeadsFromPlan,
                deliveredCount
            );
            expiringFound++;
        }
    }

    if (expiringFound === 0) {
        console.log("✅ No first-time users found who are expiring today/soon.");
    }
}

checkExpiringFirstPayment();
