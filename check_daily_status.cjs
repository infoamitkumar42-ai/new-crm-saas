const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://vewqzsqddgmkslnuctvb.supabase.co';
const ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ1MzA0NjIsImV4cCI6MjA4MDEwNjQ2Mn0.g-e8YNzEy0Z5ul1RGAhBMDj41TtWGuNPEzZz4XEGPg4";

const supabase = createClient(SUPABASE_URL, ANON_KEY);

async function checkDailyStatus() {
    console.log("📊 Checking Daily Limit Status for Himanshu's Team...\n");

    const { data: users, error } = await supabase
        .from('users')
        .select('name, email, plan_name, daily_limit, leads_today')
        .eq('is_active', true)
        .neq('plan_name', 'none')
        .order('leads_today', { ascending: false });

    if (error) {
        console.error("Error fetching users:", error.message);
        return;
    }

    let completed = [];
    let pending = [];

    users.forEach(u => {
        const limit = u.daily_limit || 0;
        const today = u.leads_today || 0;
        const remaining = Math.max(0, limit - today);

        const entry = {
            name: u.name || 'Unknown',
            email: u.email,
            plan: u.plan_name,
            limit: limit,
            today: today,
            remaining: remaining
        };

        if (today >= limit && limit > 0) {
            completed.push(entry);
        } else {
            pending.push(entry);
        }
    });

    // 🟢 COMPLETED USERS
    console.log(`✅ COMPLETED / FULL (${completed.length} Users)`);
    console.log(`| Name                     | Limit | Today | Status |`);
    console.log(`|--------------------------|-------|-------|--------|`);
    completed.forEach(u => {
        console.log(`| ${u.name.padEnd(24)} | ${String(u.limit).padEnd(5)} | ${String(u.today).padEnd(5)} | ✅ DONE |`);
    });

    console.log("\n------------------------------------------------\n");

    // 🟡 PENDING USERS
    console.log(`⏳ PENDING LEADS (${pending.length} Users)`);
    console.log(`| Name                     | Limit | Today | Pending |`);
    console.log(`|--------------------------|-------|-------|---------|`);
    pending.forEach(u => {
        console.log(`| ${u.name.padEnd(24)} | ${String(u.limit).padEnd(5)} | ${String(u.today).padEnd(5)} | 🔥 ${u.remaining} |`);
    });

    const totalPending = pending.reduce((sum, u) => sum + u.remaining, 0);
    console.log(`\n📉 TOTAL PENDING DEMAND: ${totalPending} leads`);
}

checkDailyStatus();
