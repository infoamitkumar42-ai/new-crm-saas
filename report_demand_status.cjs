const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://vewqzsqddgmkslnuctvb.supabase.co';
const ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ1MzA0NjIsImV4cCI6MjA4MDEwNjQ2Mn0.g-e8YNzEy0Z5ul1RGAhBMDj41TtWGuNPEzZz4XEGPg4";
const supabase = createClient(SUPABASE_URL, ANON_KEY);

async function checkFullStatus() {
    console.log("📊 GENERATING LIVE LEAD STATUS REPORT...\n");

    const { data: users, error } = await supabase
        .from('users')
        .select('id, name, leads_today, daily_limit, is_online')
        .eq('is_active', true)
        .eq('payment_status', 'active')
        .neq('plan_name', 'none');

    if (error) {
        console.log(`❌ Error: ${error.message}`);
        return;
    }

    // Exclude Paused Users (already covered by is_active=true filter, but double checking logic)
    // The query above ALREADY excludes users with is_active=false (the 4 paused ones).

    let totalActiveUsers = users.length;
    let usersWithLeads = 0;
    let usersWithZero = 0;
    let totalLeadsDistributed = 0;
    let totalCapacity = 0;
    let totalNeeded = 0;

    const zeroLeadUsers = [];

    users.forEach(u => {
        totalLeadsDistributed += u.leads_today || 0;
        totalCapacity += u.daily_limit || 0;

        let pending = (u.daily_limit || 0) - (u.leads_today || 0);
        if (pending < 0) pending = 0;
        totalNeeded += pending;

        if ((u.leads_today || 0) > 0) {
            usersWithLeads++;
        } else {
            usersWithZero++;
            zeroLeadUsers.push(u.name);
        }
    });

    console.log(`------------------------------------------------`);
    console.log(`✅ TOTAL ACTIVE USERS (Ready):   ${totalActiveUsers}`);
    console.log(`------------------------------------------------`);
    console.log(`📉 LEADS DISTRIBUTED SO FAR:    ${totalLeadsDistributed}`);
    console.log(`👥 USERS WHO GOT LEADS:         ${usersWithLeads}`);
    console.log(`⚠️ USERS STILL AT 0:            ${usersWithZero}`);
    console.log(`------------------------------------------------`);
    console.log(`🎯 LEADS NEEDED (To fill limits): ${totalNeeded}`);
    console.log(`------------------------------------------------`);

    if (zeroLeadUsers.length > 0) {
        console.log(`\n📋 Users at 0: ${zeroLeadUsers.slice(0, 10).join(', ')}... (+${Math.max(0, zeroLeadUsers.length - 10)} more)`);
    } else {
        console.log("\n🎉 AMAZING! No active user is at 0 leads.");
    }
}

checkFullStatus();
