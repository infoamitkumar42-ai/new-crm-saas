const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://vewqzsqddgmkslnuctvb.supabase.co';
const ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ1MzA0NjIsImV4cCI6MjA4MDEwNjQ2Mn0.g-e8YNzEy0Z5ul1RGAhBMDj41TtWGuNPEzZz4XEGPg4";

const supabase = createClient(SUPABASE_URL, ANON_KEY);

async function checkDistribution() {
    console.log("📊 CHECKING TODAY'S LEAD DISTRIBUTION...\n");

    const { data: users, error } = await supabase
        .from('users')
        .select('id, name, leads_today, daily_limit, is_online, plan_name')
        .eq('is_active', true)
        .eq('payment_status', 'active')
        .neq('plan_name', 'none')
        .order('leads_today', { ascending: false });

    if (error) {
        console.log(`❌ Error: ${error.message}`);
        return;
    }

    let zeroLeads = 0;
    let someLeads = 0;
    let fullLeads = 0;
    let totalLeadsDistributed = 0;

    console.log("🏆 TOP 10 USERS with leads today:");
    users.slice(0, 10).forEach(u => {
        if (u.leads_today > 0) {
            console.log(`  ✅ ${u.name.padEnd(20)}: ${u.leads_today}/${u.daily_limit} (${u.is_online ? '🟢' : '🔴'})`);
        }
    });

    const zeroLeadUsers = [];

    users.forEach(u => {
        totalLeadsDistributed += u.leads_today;
        if (u.leads_today === 0) {
            zeroLeads++;
            if (u.is_online) zeroLeadUsers.push(u);
        } else if (u.leads_today >= u.daily_limit) {
            fullLeads++;
        } else {
            someLeads++;
        }
    });

    console.log(`\n📈 SUMMARY:`);
    console.log(`  - Total Active Users: ${users.length}`);
    console.log(`  - Total Leads Delivered: ${totalLeadsDistributed}`);
    console.log(`  - Users with Leads: ${someLeads + fullLeads}`);
    console.log(`  - Users with 0 Leads: ${zeroLeads}`);

    if (zeroLeadUsers.length > 0) {
        console.log(`\n⚠️ ONLINE USERS WITH 0 LEADS (${zeroLeadUsers.length}):`);
        zeroLeadUsers.slice(0, 15).forEach(u => {
            console.log(`  🔴 ${u.name.padEnd(20)} (Limit: ${u.daily_limit})`);
        });
        if (zeroLeadUsers.length > 15) console.log(`  ...and ${zeroLeadUsers.length - 15} more`);
    } else {
        console.log("\n✅ GREAT! No online active users are at 0 leads.");
    }
}

checkDistribution();
