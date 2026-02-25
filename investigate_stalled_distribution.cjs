const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = "https://vewqzsqddgmkslnuctvb.supabase.co";
const SUPABASE_SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDUzMDQ2MiwiZXhwIjoyMDgwMTA2NDYyfQ.pAgMGN6MtKm1A3fsKr1GIt8-qmKYhwFjSt92L_6_7us";

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function investigate() {
    console.log("🕵️ INVESTIGATING STALLED DISTRIBUTION (Since 5 PM IST)...");

    // 1. Check User Status
    const targetEmail = 'officialrajinderdhillon@gmail.com';
    const { data: user, error: uError } = await supabase
        .from('users')
        .select('*')
        .eq('email', targetEmail)
        .single();

    if (uError) { console.error("User Error:", uError); }
    else {
        console.log(`\n👤 User: ${user.name} (${user.email})`);
        console.log(`   - Plan: ${user.plan_name}`);
        console.log(`   - Daily Limit: ${user.daily_limit_override || user.daily_limit}`);
        console.log(`   - Leads Today: ${user.leads_today}`);
        console.log(`   - Payment Status: ${user.payment_status}`);
        console.log(`   - Is Active: ${user.is_active}`);

        const remaining = (user.daily_limit_override || user.daily_limit) - (user.leads_today || 0);
        console.log(`   - REMAINING QUOTA: ${remaining}`);
    }

    // 2. Check Leads since 5 PM IST
    // 5 PM IST = 11:30 AM UTC
    // Today's date string
    const today = new Date().toISOString().split('T')[0];
    const cutoffTime = `${today}T11:30:00.000Z`; // Approx 5 PM IST

    console.log(`\n📉 Analyzing Leads created after ${cutoffTime} (UTC)...`);

    const { data: leads, error: lError } = await supabase
        .from('leads')
        .select('id, status, assigned_to, source, created_at')
        .gte('created_at', cutoffTime)
        .order('created_at', { ascending: true });

    if (lError) { console.error("Leads Error:", lError); return; }

    const stats = {
        total: leads.length,
        assigned: 0,
        queued: 0,
        failed: 0,
        duplicate: 0,
        assigned_to_target: 0
    };

    const assignedMap = {};

    leads.forEach(l => {
        if (l.status === 'Assigned' && l.assigned_to) {
            stats.assigned++;
            assignedMap[l.assigned_to] = (assignedMap[l.assigned_to] || 0) + 1;
            if (l.assigned_to === user?.id) stats.assigned_to_target++;
        } else if (l.status === 'New' || l.status === 'Queued') {
            stats.queued++;
        } else if (l.status === 'Failed') {
            stats.failed++;
        } else if (l.status === 'Duplicate') {
            stats.duplicate++;
        }
    });

    console.log(`\n📊 Lead Flow Summary (Since 5 PM):`);
    console.log(`   - Total Incoming: ${stats.total}`);
    console.log(`   - Successfully Assigned: ${stats.assigned}`);
    console.log(`   - Stuck in Queue: ${stats.queued}`);
    console.log(`   - Failed: ${stats.failed}`);
    console.log(`   - Duplicates: ${stats.duplicate}`);
    console.log(`   - Assigned to Rajinder: ${stats.assigned_to_target}`);

    // If leads were assigned, WHO got them?
    if (stats.assigned > 0) {
        console.log(`\n🏆 Who got the leads?`);
        // Fetch names for top 5 receivers
        const topReceivers = Object.entries(assignedMap)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 5);

        for (const [uid, count] of topReceivers) {
            const { data: u } = await supabase.from('users').select('name, plan_name').eq('id', uid).single();
            console.log(`   - ${u?.name} (${u?.plan_name}): ${count} leads`);
        }
    }
}

investigate();
