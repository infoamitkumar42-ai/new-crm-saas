const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://api.leadflowcrm.in';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseKey) {
    console.error('Error: SUPABASE_SERVICE_ROLE_KEY is required in .env');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkUserHistory() {
    const email = 'sipreet73@gmail.com';
    console.log(`\n🔍 Fetching history for: ${email}...\n`);

    // 1. Get User Details
    const { data: user, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('email', email)
        .single();

    if (userError || !user) {
        console.error('❌ User not found:', userError?.message);
        return;
    }

    console.log(`👤 User: ${user.full_name} (${user.id})`);
    console.log(`📌 Current Plan: ${user.plan_name}`);
    console.log(`🎯 Total Leads Promised (Current): ${user.total_leads_promised}`);
    console.log(`📥 Total Leads Received (Profile): ${user.total_leads_received}\n`);

    // 2. Get All Payments
    const { data: payments, error: payError } = await supabase
        .from('payments')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'captured')
        .order('created_at', { ascending: false });

    if (payError) {
        console.error('Error fetching payments:', payError.message);
    } else {
        let totalPaid = 0;
        let febPaid = 0;

        console.log('💳 PAYMENT HISTORY:');
        if (payments.length === 0) {
            console.log('  No captured payments found.');
        } else {
            payments.forEach(p => {
                const date = new Date(p.created_at);
                const amount = p.amount;
                totalPaid += amount;

                // Check if February
                if (date.getMonth() === 1) { // 0=Jan, 1=Feb
                    febPaid += amount;
                }

                console.log(`  - ${date.toISOString().split('T')[0]} | ₹${amount} | Plan: ${p.plan_name} | ID: ${p.razorpay_payment_id}`);
            });
        }
        console.log(`\n💰 TOTAL PAID (All Time): ₹${totalPaid}`);
        console.log(`📈 FEB TOTAL PAID: ₹${febPaid}\n`);
    }

    // 3. Get All Leads
    const { count: totalLeads, error: leadsError } = await supabase
        .from('leads')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id);

    if (leadsError) {
        console.error('Error fetching leads:', leadsError.message);
    }

    const { data: allLeads, error: allLeadsError } = await supabase
        .from('leads')
        .select('id, created_at')
        .eq('user_id', user.id);

    let febLeadsCount = 0;
    if (allLeads) {
        allLeads.forEach(l => {
            const d = new Date(l.created_at);
            if (d.getMonth() === 1 && d.getFullYear() === 2026) {
                febLeadsCount++;
            }
        });
    }

    console.log('📊 LEADS HISTORY:');
    console.log(`  - Total Leads Received (All Time - DB Count): ${totalLeads || 0}`);
    console.log(`  - Leads Received in February 2026: ${febLeadsCount}`);

}

checkUserHistory();
