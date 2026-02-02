const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://vewqzsqddgmkslnuctvb.supabase.co';
const ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ1MzA0NjIsImV4cCI6MjA4MDEwNjQ2Mn0.g-e8YNzEy0Z5ul1RGAhBMDj41TtWGuNPEzZz4XEGPg4";
const supabase = createClient(SUPABASE_URL, ANON_KEY);

async function calculatePendingLeads() {
    console.log("📊 CALCULATING PENDING LEADS FOR TODAY...\n");
    console.log(`Time: ${new Date().toLocaleTimeString()}\n`);

    // Get all ONLINE users (eligible for leads)
    const { data: users } = await supabase
        .from('users')
        .select('name, daily_limit, leads_today, plan_name')
        .eq('is_online', true)
        .eq('is_active', true)
        .eq('payment_status', 'active')
        .neq('plan_name', 'none')
        .order('leads_today', { ascending: true });

    if (!users || users.length === 0) {
        console.log("No eligible users found.");
        return;
    }

    let totalPending = 0;
    let usersPending = 0;
    let usersFull = 0;

    console.log(`${'Name'.padEnd(22)} | Limit | Today | Pending`);
    console.log(`${'─'.repeat(22)} | ───── | ───── | ───────`);

    users.forEach(u => {
        const limit = u.daily_limit || 0;
        const today = u.leads_today || 0;
        const pending = Math.max(0, limit - today);

        totalPending += pending;

        if (pending > 0) {
            usersPending++;
            console.log(`${u.name.padEnd(22)} | ${String(limit).padStart(5)} | ${String(today).padStart(5)} | ${String(pending).padStart(7)} 🔴`);
        } else {
            usersFull++;
        }
    });

    console.log(`\n${'═'.repeat(50)}`);
    console.log(`📊 SUMMARY:`);
    console.log(`${'═'.repeat(50)}`);
    console.log(`👥 Total Online Users:     ${users.length}`);
    console.log(`🔴 Users with Pending:     ${usersPending}`);
    console.log(`✅ Users Full (Limit Hit): ${usersFull}`);
    console.log(`${'─'.repeat(50)}`);
    console.log(`🎯 TOTAL LEADS TO GENERATE: ${totalPending}`);
    console.log(`${'═'.repeat(50)}`);
}

calculatePendingLeads();
