
const { createClient } = require('@supabase/supabase-js');
const SUPABASE_URL = 'https://vewqzsqddgmkslnuctvb.supabase.co';
const ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ1MzA0NjIsImV4cCI6MjA4MDEwNjQ2Mn0.g-e8YNzEy0Z5ul1RGAhBMDj41TtWGuNPEzZz4XEGPg4";
const supabase = createClient(SUPABASE_URL, ANON_KEY);

async function calculateLeadGap() {
    console.log("📊 --- LEAD GAP ANALYSIS REPORT --- 📊\n");

    // 1. Get all active users
    const { data: users, error } = await supabase
        .from('users')
        .select('name, team_code, leads_today, daily_limit, is_active')
        .eq('is_active', true);

    if (error) {
        console.error("Error fetching users:", error);
        return;
    }

    const report = {
        'TEAMFIRE': { active_users: 0, total_limit: 0, leads_delivered: 0, gap: 0 },
        'TEAMRAJ': { active_users: 0, total_limit: 0, leads_delivered: 0, gap: 0 }
    };

    users.forEach(u => {
        if (report[u.team_code]) {
            report[u.team_code].active_users++;
            report[u.team_code].total_limit += (u.daily_limit || 0);
            report[u.team_code].leads_delivered += (u.leads_today || 0);
        }
    });

    // Calculate Gap
    Object.keys(report).forEach(team => {
        report[team].gap = report[team].total_limit - report[team].leads_delivered;
        if (report[team].gap < 0) report[team].gap = 0; // Negative gap means over-limit which we handle as 0 needed
    });

    console.log("📍 TEAM: HIMANSHU (TEAMFIRE)");
    console.log(`   - Active Users (Online): ${report['TEAMFIRE'].active_users}`);
    console.log(`   - Total Daily Target: ${report['TEAMFIRE'].total_limit} leads`);
    console.log(`   - Leads Distributed: ${report['TEAMFIRE'].leads_delivered} leads`);
    console.log(`   - 📉 REMAINING LEADS NEEDED: ${report['TEAMFIRE'].gap} leads`);
    console.log("   ------------------------------------------------");

    console.log("📍 TEAM: RAJWINDER (TEAMRAJ)");
    console.log(`   - Active Users (Online): ${report['TEAMRAJ'].active_users}`);
    console.log(`   - Total Daily Target: ${report['TEAMRAJ'].total_limit} leads`);
    console.log(`   - Leads Distributed: ${report['TEAMRAJ'].leads_delivered} leads`);
    console.log(`   - 📉 REMAINING LEADS NEEDED: ${report['TEAMRAJ'].gap} leads`);
    console.log("   ------------------------------------------------");

    const totalGap = report['TEAMFIRE'].gap + report['TEAMRAJ'].gap;
    console.log(`\n✅ SUMMARY: You need to generate approximately ${totalGap} more leads today to fulfill all active user limits.`);
}

calculateLeadGap();
