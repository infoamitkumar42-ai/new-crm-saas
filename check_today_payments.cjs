const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://vewqzsqddgmkslnuctvb.supabase.co';
const ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ1MzA0NjIsImV4cCI6MjA4MDEwNjQ2Mn0.g-e8YNzEy0Z5ul1RGAhBMDj41TtWGuNPEzZz4XEGPg4";
const supabase = createClient(SUPABASE_URL, ANON_KEY);

async function checkTodayPayments() {
    console.log("💰 CHECKING TODAY'S PAYMENTS...\n");

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Check payments table
    const { data: payments, error } = await supabase
        .from('payments')
        .select('*')
        .gte('created_at', today.toISOString())
        .order('created_at', { ascending: false });

    if (error) {
        console.log("Error fetching payments:", error.message);
    } else if (!payments || payments.length === 0) {
        console.log("❌ No payments found today in 'payments' table.");
    } else {
        console.log(`✅ Found ${payments.length} payments today:`);
        let total = 0;
        for (const p of payments) {
            // Get user name separately
            const { data: user } = await supabase.from('users').select('name').eq('id', p.user_id).single();
            console.log(`- ${user?.name || p.user_id}: ₹${p.amount} (${p.status})`);
            if (p.status === 'captured' || p.status === 'success') total += (p.amount || 0);
        }
        console.log(`\nTOTAL REVENUE TODAY: ₹${total}`);
    }

    // Also check orphan leads
    console.log("\n📦 CHECKING ORPHAN LEADS...");
    const { data: orphans } = await supabase
        .from('leads')
        .select('id, name, phone, city, created_at')
        .or('status.eq.New,status.eq.Fresh')
        .is('user_id', null)
        .order('created_at', { ascending: false })
        .limit(10);

    if (orphans && orphans.length > 0) {
        console.log(`Found ${orphans.length} orphan leads:`);
        orphans.forEach(l => console.log(`- ${l.name} (${l.phone}) - ${l.city}`));
    } else {
        console.log("No orphan leads found.");
    }
}

checkTodayPayments();
