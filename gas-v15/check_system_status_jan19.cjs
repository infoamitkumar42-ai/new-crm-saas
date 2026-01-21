
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://vewqzsqddgmkslnuctvb.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDUzMDQ2MiwiZXhwIjoyMDgwMTA2NDYyfQ.pAgMGN6MtKm1A3fsKr1GIt8-qmKYhwFjSt92L_6_7us';
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkSystemStatus() {
    console.log("🌅 SYSTEM STATUS CHECK (Jan 19, Morning Audit)...\n");

    const todayStart = '2026-01-18T18:30:00.000Z'; // Midnight IST for Jan 19

    // 1. Check Leads Today
    const { count: leadsToday } = await supabase
        .from('leads')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', todayStart);

    // 2. Check Assigned Today
    const { count: assignedToday } = await supabase
        .from('leads')
        .select('*', { count: 'exact', head: true })
        .gte('assigned_at', todayStart)
        .eq('status', 'Assigned');

    // 3. User Stats
    const { data: users, error } = await supabase
        .from('users')
        .select('id, name, email, leads_today, daily_limit')
        .eq('is_active', true);

    if (error) { console.error("Err:", error); return; }

    const activeUsers = users.length;
    const usersWithLeads = users.filter(u => u.leads_today > 0).length;
    const fullUsers = users.filter(u => u.daily_limit > 0 && u.leads_today >= u.daily_limit);

    // 4. Check Specific Paused Users
    const ruchi = users.find(u => u.email === 'ruchitanwar2004@gmail.com');
    const kirandeep = users.find(u => u.email === 'kirandeepkaur7744@gmail.com');

    console.log(`📊 TODAY'S METRICS (Since Midnight):`);
    console.log(`   Leads Generated:      ${leadsToday}`);
    console.log(`   Leads Distributed:    ${assignedToday}`);
    console.log(`   Backlog/Pending:      ${leadsToday - assignedToday}`);
    console.log("-".repeat(40));
    console.log(`   Active Users:         ${activeUsers}`);
    console.log(`   Users Received Leads: ${usersWithLeads}`);
    console.log(`   Users Already Full:   ${fullUsers.length}`);
    console.log("-".repeat(40));
    console.log(`🔍 PAUSED USERS CHECK:`);
    console.log(`   👤 Ruchi: Limit = ${ruchi?.daily_limit || 'N/A'} (Leads: ${ruchi?.leads_today})`);
    console.log(`   👤 Kirandeep: Limit = ${kirandeep?.daily_limit || 'N/A'} (Leads: ${kirandeep?.leads_today})`);

    // Alert if leads pending
    if (leadsToday - assignedToday > 5) {
        console.log(`\n⚠️ ALERT: ${leadsToday - assignedToday} leads are waiting distribution!`);
    } else {
        console.log(`\n✅ SYSTEM IS RUNNING SMOOTHLY.`);
    }
}

checkSystemStatus();
