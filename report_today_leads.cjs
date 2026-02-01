const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://vewqzsqddgmkslnuctvb.supabase.co';
const ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ1MzA0NjIsImV4cCI6MjA4MDEwNjQ2Mn0.g-e8YNzEy0Z5ul1RGAhBMDj41TtWGuNPEzZz4XEGPg4";
const supabase = createClient(SUPABASE_URL, ANON_KEY);

async function checkTodayDistribution() {
    console.log("📊 TODAY'S LEAD DISTRIBUTION REPORT (Feb 1st)...\n");

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const ts = todayStart.toISOString();

    const { data: leads, error } = await supabase
        .from('leads')
        .select('name, created_at, assigned_to_user:users(name, plan_name)')
        .gte('created_at', ts)
        .order('created_at', { ascending: false });

    if (error) return console.error(error);

    if (leads.length === 0) {
        console.log("⚠️ No leads received today yet.");
    } else {
        console.log(`Total Leads Today: ${leads.length}`);
        console.log(`\nLead List (Latest First):`);
        console.log(`Time      | Assigned To          | Lead Name`);
        console.log(`----------|----------------------|-----------------`);

        const summary = {};

        for (const l of leads) {
            const time = new Date(l.created_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
            const agent = l.assigned_to_user?.name || 'Unassigned';

            console.log(`${time.padEnd(9)} | ${agent.slice(0, 20).padEnd(20)} | ${l.name}`);

            if (!summary[agent]) summary[agent] = 0;
            summary[agent]++;
        }

        console.log(`\n📌 AGENT SUMMARY:`);
        for (const [name, count] of Object.entries(summary)) {
            console.log(`   - ${name}: ${count}`);
        }
    }
}

checkTodayDistribution();
