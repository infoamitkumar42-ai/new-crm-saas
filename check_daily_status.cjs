const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Manually load env vars from .env
const envPath = path.join(process.cwd(), '.env');
const envConfig = fs.readFileSync(envPath, 'utf8');
const env = {};
envConfig.split('\n').forEach(line => {
    const [key, value] = line.split('=');
    if (key && value) env[key.trim()] = value.trim().replace(/^"|"$/g, '');
});

const supabase = createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_ANON_KEY);

async function checkTodayLeads() {
    const now = new Date();
    // UTC "Today" starts at midnight UTC
    const todayUTC = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())).toISOString();

    // Indian "Today" starts at midnight IST (UTC-5:30)
    // To be safe, let's check everything from the last 24 hours
    const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();

    console.log(`\n📊 Precise System Audit (Last 24 Hours)`);
    console.log(`🕒 Current Time: ${now.toISOString()}`);

    // 1. Fetch leads from last 24 hours to find the "today" start
    const { data: leads, error: leadsError } = await supabase
        .from('leads')
        .select('id, assigned_to, name, status, created_at')
        .order('created_at', { ascending: false })
        .limit(500);

    if (leadsError) {
        console.error('Error fetching leads:', leadsError);
        return;
    }

    // Filter leads created since 12:00 AM IST today
    // IST = UTC + 5:30. So 12:00 AM IST = 6:30 PM UTC (Yesterday)
    const startOfTodayIST = new Date();
    startOfTodayIST.setHours(0, 0, 0, 0); // Local midnight

    const todayLeads = leads.filter(l => new Date(l.created_at) >= startOfTodayIST);

    console.log(`✅ Leads generated since 12:00 AM IST Today: ${todayLeads.length}`);

    // 2. Distributions by teams (using the list we already got)
    const { data: users, error: usersError } = await supabase
        .from('users')
        .select('email, name, role, team_code, leads_today, daily_limit')
        .gt('leads_today', 0)
        .order('leads_today', { ascending: false });

    if (usersError) return;

    const teams = {};
    users.forEach(u => {
        const team = u.team_code || 'No Team';
        if (!teams[team]) teams[team] = { membersCount: 0, totalLeads: 0 };
        teams[team].membersCount++;
        teams[team].totalLeads += u.leads_today;
    });

    console.log('\n👥 Team Distribution Summary:');
    Object.keys(teams).forEach(t => {
        console.log(`📍 Team ${t}: ${teams[t].totalLeads} leads distributed to ${teams[t].membersCount} members.`);
    });

    // 3. Manager Safety Check
    const managersWithLeads = users.filter(u => u.role === 'manager');
    if (managersWithLeads.length > 0) {
        console.log('\n❌ ALERT: Managers received leads!');
        managersWithLeads.forEach(m => console.log(`   - ${m.name}: ${m.leads_today}`));
    } else {
        console.log('\n✅ Integrity: No managers received leads today.');
    }

    // 4. Verification Check
    if (todayLeads.length > 0) {
        console.log('\n✨ System Performance:');
        console.log(`   - Leads are being assigned in real-time.`);
        console.log(`   - Latest Lead: ${todayLeads[0].name} at ${new Date(todayLeads[0].created_at).toLocaleTimeString()}`);
    } else {
        console.log('\n⚠️ No leads in Table for today yet (Wait for Meta Webhook traffic).');
    }
}

checkTodayLeads();
