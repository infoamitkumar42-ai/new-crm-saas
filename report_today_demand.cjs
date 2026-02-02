const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://vewqzsqddgmkslnuctvb.supabase.co';
const ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ1MzA0NjIsImV4cCI6MjA4MDEwNjQ2Mn0.g-e8YNzEy0Z5ul1RGAhBMDj41TtWGuNPEzZz4XEGPg4";

const supabase = createClient(SUPABASE_URL, ANON_KEY);

async function generateTodayReport() {
    console.log("📊 ACTIVE USERS & TODAY'S LEAD DEMAND REPORT");
    console.log("Date: " + new Date().toLocaleDateString('en-IN'));
    console.log("=".repeat(70) + "\n");

    // Fetch all active users with plan
    const { data: users, error } = await supabase
        .from('users')
        .select('id, name, plan_name, is_active, leads_today, daily_limit, total_leads_received, total_leads_promised')
        .eq('is_active', true)
        .neq('plan_name', 'none')
        .order('leads_today', { ascending: false });

    if (error) return console.log(error.message);

    let totalLeadsToday = 0;
    let totalDailyCapacity = 0;
    let usersWithLeads = 0;
    let usersAtZero = 0;

    console.log("📋 ALL ACTIVE USERS (Plan Running):\n");
    console.log(`| #  | Name                   | Plan         | Today  | Daily Limit | Total Rec/Promised |`);
    console.log(`|----|------------------------|--------------|--------|-------------|---------------------|`);

    users.forEach((u, i) => {
        const today = u.leads_today || 0;
        const limit = u.daily_limit || 0;
        const received = u.total_leads_received || 0;
        const promised = u.total_leads_promised || 0;

        totalLeadsToday += today;
        totalDailyCapacity += limit;

        if (today > 0) usersWithLeads++;
        else usersAtZero++;

        console.log(`| ${String(i + 1).padEnd(2)} | ${(u.name || 'Unknown').padEnd(22)} | ${(u.plan_name || '-').padEnd(12)} | ${String(today).padEnd(6)} | ${String(limit).padEnd(11)} | ${received}/${promised} |`);
    });

    const leadsNeeded = totalDailyCapacity - totalLeadsToday;

    console.log("\n" + "=".repeat(70));
    console.log("📊 TODAY'S SUMMARY");
    console.log("=".repeat(70));
    console.log(`✅ Total Active Users:           ${users.length}`);
    console.log(`📈 Users Who Got Leads Today:    ${usersWithLeads}`);
    console.log(`⚠️  Users Still at 0:            ${usersAtZero}`);
    console.log("─".repeat(70));
    console.log(`📦 Total Leads Distributed Today: ${totalLeadsToday}`);
    console.log(`🎯 Total Daily Capacity:         ${totalDailyCapacity}`);
    console.log(`🔥 LEADS NEEDED TODAY:           ${leadsNeeded}`);
    console.log("=".repeat(70));
}

generateTodayReport();
