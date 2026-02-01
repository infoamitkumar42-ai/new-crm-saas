const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://vewqzsqddgmkslnuctvb.supabase.co';
const ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ1MzA0NjIsImV4cCI6MjA4MDEwNjQ2Mn0.g-e8YNzEy0Z5ul1RGAhBMDj41TtWGuNPEzZz4XEGPg4";
const supabase = createClient(SUPABASE_URL, ANON_KEY);

async function fullStatusReport() {
    console.log("📊 FULL STATUS & PENDING QUOTA REPORT (Active Plans Only)...\n");

    const { data: users, error } = await supabase
        .from('users')
        .select('name, is_online, updated_at, leads_today, daily_limit, plan_name')
        .eq('is_active', true)
        .neq('plan_name', 'none')
        .order('is_online', { ascending: false }) // Online First
        .order('leads_today', { ascending: false });

    if (error) return console.error(error);

    let totalPending = 0;
    let onlinePending = 0;
    let offlinePending = 0;

    console.log(`Name                 | Status  | Received | Limit | PENDING | Plan`);
    console.log(`---------------------|---------|----------|-------|---------|-------------`);

    for (const u of users) {
        let pending = u.daily_limit - u.leads_today;
        if (pending < 0) pending = 0; // No negative needed

        totalPending += pending;

        const statusIcon = u.is_online ? "🟢 ON" : "🔴 OFF";
        if (u.is_online) onlinePending += pending; else offlinePending += pending;

        console.log(
            `${u.name.slice(0, 19).padEnd(20)} | ` +
            `${statusIcon.padEnd(7)} | ` +
            `${String(u.leads_today).padEnd(8)} | ` +
            `${String(u.daily_limit).padEnd(5)} | ` +
            `**${String(pending).padEnd(5)}** | ` +
            `${u.plan_name}`
        );
    }

    console.log(`\n=================================================`);
    console.log(`📢 TOTAL LEADS NEEDED (PENDING): ${totalPending}`);
    console.log(`=================================================`);
    console.log(`🟢 Needed for ONLINE Users:      ${onlinePending}`);
    console.log(`🔴 Needed for OFFLINE Users:     ${offlinePending}`);
}

fullStatusReport();
