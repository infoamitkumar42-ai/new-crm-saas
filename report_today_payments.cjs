const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://vewqzsqddgmkslnuctvb.supabase.co';
const ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ1MzA0NjIsImV4cCI6MjA4MDEwNjQ2Mn0.g-e8YNzEy0Z5ul1RGAhBMDj41TtWGuNPEzZz4XEGPg4";

const supabase = createClient(SUPABASE_URL, ANON_KEY);

async function checkTodayPayments() {
    console.log("💰 Checking Payments Received TODAY (IST time)...\n");

    const now = new Date();
    // Start of day in IST (UTC+5:30)
    const todayStart = new Date(now.getTime() - (now.getHours() * 60 * 60 * 1000) - (now.getMinutes() * 60 * 1000));
    const todayISO = todayStart.toISOString();

    const { data: payments, error } = await supabase
        .from('payments')
        .select('email, amount, plan_name, created_at, user_id')
        .gte('created_at', todayISO)
        .eq('status', 'captured')
        .order('created_at', { ascending: false });

    if (error) {
        console.error("Error fetching payments:", error.message);
        return;
    }

    // Filter out our SYSTEM FIX payments (amount 0 or 1000 with fake ID)
    const realPayments = payments.filter(p => p.amount > 0 && !p.plan_name.includes('SYSTEM'));

    if (realPayments.length === 0) {
        console.log("❌ No real payments received today.");
        return;
    }

    console.log(`💵 TOTAL REVENUE TODAY: ₹${realPayments.reduce((sum, p) => sum + (p.amount || 0), 0)}`);
    console.log(`👥 TOTAL TRANSACTIONS: ${realPayments.length}\n`);

    console.log(`| Time (IST) | Email                     | Amount | Plan          | Type |`);
    console.log(`|------------|---------------------------|--------|---------------|------|`);

    for (const p of realPayments) {
        // Check if this is the FIRST payment ever for this user
        const { count } = await supabase
            .from('payments')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', p.user_id)
            .lt('created_at', p.created_at);

        const isNewUser = count === 0 ? '🆕 NEW' : '♻️ RENEWAL';
        const date = new Date(p.created_at);
        const timeStr = date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Kolkata' });

        console.log(`| ${timeStr.padEnd(10)} | ${p.email.padEnd(25)} | ₹${String(p.amount).padEnd(5)} | ${p.plan_name.padEnd(13)} | ${isNewUser} |`);
    }
}

checkTodayPayments();
