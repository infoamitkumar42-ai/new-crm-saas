const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = "https://vewqzsqddgmkslnuctvb.supabase.co";
const SUPABASE_SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDUzMDQ2MiwiZXhwIjoyMDgwMTA2NDYyfQ.pAgMGN6MtKm1A3fsKr1GIt8-qmKYhwFjSt92L_6_7us";

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

const email = "princyrani303@gmail.com";

async function deepAudit() {
    console.log(`🔍 DEEP ANALYSIS FOR: ${email}`);

    // 1. Get Princy's full state
    const { data: user, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('email', email)
        .single();

    if (userError || !user) {
        console.error("User error:", userError);
        return;
    }

    console.log(`\n📋 Princy's Technical State:`);
    console.log(`   - ID: ${user.id}`);
    console.log(`   - Team: ${user.team_code}`);
    console.log(`   - Daily Limit: ${user.daily_limit}`);
    console.log(`   - Leads Today: ${user.leads_today}`);
    console.log(`   - Is Active: ${user.is_active}`);
    console.log(`   - Is Online: ${user.is_online}`);
    console.log(`   - Is Paused: ${user.is_paused}`); // Checking if it exists
    console.log(`   - Plan Name: ${user.plan_name}`);
    console.log(`   - Plan End Date: ${user.plan_end_date}`); // Checking if it exists
    console.log(`   - Last Assigned At: ${user.last_assigned_at}`);

    // 2. Fetch Team Members from TEAMFIRE who GOT leads today
    const { data: teamMembers, error: teamError } = await supabase
        .from('users')
        .select('name, email, leads_today, daily_limit, is_online, is_active, last_assigned_at')
        .eq('team_code', 'TEAMFIRE')
        .gt('leads_today', 0)
        .order('last_assigned_at', { ascending: false });

    console.log(`\n👥 Active Members in TEAMFIRE with Leads Today:`);
    if (teamMembers && teamMembers.length > 0) {
        teamMembers.forEach(m => {
            console.log(`   - ${m.name.padEnd(20)} | Leads: ${m.leads_today}/${m.daily_limit} | Online: ${m.is_online} | Last Assigned: ${m.last_assigned_at}`);
        });
    } else {
        console.log("   - No other members found with leads today.");
    }

    // 3. Check for Plan Expiry Logic
    console.log(`\n📅 Plan Expiry Check:`);
    const now = new Date();
    const planStart = new Date(user.plan_start_date);
    const daysSinceStart = Math.floor((now - planStart) / (1000 * 60 * 60 * 24));
    console.log(`   - Plan started on: ${user.plan_start_date}`);
    console.log(`   - Days since start: ${daysSinceStart}`);
    console.log(`   - Promised Leads: ${user.total_leads_promised}`);
    console.log(`   - Received Leads: ${user.total_leads_received}`);

    if (user.total_leads_received >= user.total_leads_promised) {
        console.log(`   - ⚠️ ALERT: User has already received all promised leads (${user.total_leads_received}/${user.total_leads_promised}). Distribution might have stopped.`);
    }

    // 4. Check Webhook Logs for Assignment Failures
    const { data: webhookErrors } = await supabase
        .from('webhook_errors')
        .select('*')
        .eq('email', email)
        .order('created_at', { ascending: false })
        .limit(5);

    if (webhookErrors && webhookErrors.length > 0) {
        console.log(`\n❌ Recent Webhook Errors for Princy:`);
        webhookErrors.forEach(e => {
            console.log(`   - ${e.created_at}: ${e.error_message}`);
        });
    } else {
        console.log(`\n✅ No recent webhook errors found for Princy.`);
    }
}

deepAudit();
