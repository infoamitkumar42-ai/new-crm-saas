const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://vewqzsqddgmkslnuctvb.supabase.co';
const ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ1MzA0NjIsImV4cCI6MjA4MDEwNjQ2Mn0.g-e8YNzEy0Z5ul1RGAhBMDj41TtWGuNPEzZz4XEGPg4";

const supabase = createClient(SUPABASE_URL, ANON_KEY);

async function checkTodayPayments() {
    console.log("💰 Checking Payments Received TODAY (Since Midnight UTC)...\n");

    const { data: payments, error } = await supabase
        .from('payments')
        .select('*') // JOIN issue avoid karte hain, simple select
        .gte('created_at', '2026-02-03T00:00:00.000Z')
        .eq('status', 'captured')
        .order('created_at', { ascending: false });

    if (error) {
        console.error("Error fetching payments:", error.message);
        return;
    }

    // Filter out SYSTEM FIXES
    const realPayments = payments.filter(p => {
        if (p.razorpay_payment_id && (p.razorpay_payment_id.includes('SYSTEM') || p.razorpay_payment_id.includes('FIX'))) return false;
        return true;
    });

    if (realPayments.length === 0) {
        console.log("❌ No real payments received today.");
        return;
    }

    console.log(`💵 TOTAL REVENUE TODAY: ₹${realPayments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0)}`);
    console.log(`👥 TOTAL TRANSACTIONS: ${realPayments.length}\n`);

    console.log(`| Time (UTC) | Email (fetched)           | Amount | Plan          | Type |`);
    console.log(`|------------|---------------------------|--------|---------------|------|`);

    let newUsersCount = 0;

    for (const p of realPayments) {
        // Fetch User Email Manually
        const { data: userData } = await supabase.from('users').select('email').eq('id', p.user_id).single();
        const userEmail = userData?.email || 'Unknown';

        // Check Previous Payments
        const { count } = await supabase
            .from('payments')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', p.user_id)
            .lt('created_at', p.created_at);

        const isNewUser = count === 0;
        if (isNewUser) newUsersCount++;

        const typeLabel = isNewUser ? '🆕 NEW' : '♻️ RENEWAL';
        const date = new Date(p.created_at);
        const timeStr = date.toISOString().substr(11, 5);

        console.log(`| ${timeStr.padEnd(10)} | ${userEmail.padEnd(25)} | ₹${String(p.amount).padEnd(5)} | ${(p.plan_name || '-').padEnd(13)} | ${typeLabel} |`);
    }

    console.log(`\n📊 SUMMARY:`);
    console.log(`- New Users: ${newUsersCount}`);
    console.log(`- Renewals:  ${realPayments.length - newUsersCount}`);
}

checkTodayPayments();
