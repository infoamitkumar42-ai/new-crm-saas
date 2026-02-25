const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = "https://vewqzsqddgmkslnuctvb.supabase.co";
const SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDUzMDQ2MiwiZXhwIjoyMDgwMTA2NDYyfQ.pAgMGN6MtKm1A3fsKr1GIt8-qmKYhwFjSt92L_6_7us";
const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

const PLAN_LIMITS = {
    'starter': 50,
    'weekly_boost': 100,
    'manager': 200,
    'supervisor': 150,
    'turbo_boost': 250
};

async function main() {
    console.log("🔄 Starting the Reassignment and Deactivation Process...\n");

    const emailToDeactivate = 'cmdarji1997@gmail.com';
    const TEAM_CODE = 'GJ01TEAMFIRE';
    const startStr = '2026-02-21T00:00:00.000+05:30';
    const endStr = '2026-02-21T23:59:59.999+05:30';

    // 1. Get the user's current record
    const { data: userToDeactivate, error: err1 } = await supabase
        .from('users')
        .select('*')
        .eq('email', emailToDeactivate)
        .single();

    if (err1 || !userToDeactivate) {
        console.error("User not found:", err1?.message);
        return;
    }

    console.log(`Found User: ${userToDeactivate.name} (${userToDeactivate.email})`);

    // 2. Mark User Inactive
    console.log(`- Marking user as INACTIVE (is_active: false)`);
    await supabase.from('users').update({ is_active: false }).eq('id', userToDeactivate.id);

    // 3. Find the lead they got today
    const { data: leads, error: err2 } = await supabase
        .from('leads')
        .select('*')
        .eq('assigned_to', userToDeactivate.id)
        .gte('created_at', startStr)
        .lte('created_at', endStr)
        .order('assigned_at', { ascending: false })
        .limit(1);

    if (err2 || !leads || leads.length === 0) {
        console.log("❌ No leads found assigned to them today to reassign.");
        return;
    }

    const leadToReassign = leads[0];
    console.log(`- Found Lead to Reassign: ${leadToReassign.name} (Assigned at ${leadToReassign.assigned_at})`);

    // 4. Find another eligible user in TEAMFIRE
    const { data: teamUsers, error: tErr } = await supabase
        .from('users')
        .select('id, name, email, plan_name, is_active, leads_today')
        .eq('team_code', TEAM_CODE)
        .eq('is_active', true);

    if (tErr) {
        console.error("Error fetching team:", tErr.message); return;
    }

    const eligibleUsers = teamUsers.filter(u => {
        const limit = PLAN_LIMITS[u.plan_name] || 9999;
        return (u.leads_today || 0) < limit && u.id !== userToDeactivate.id;
    });

    if (eligibleUsers.length === 0) {
        console.log("❌ No other eligible active users found in TEAMFIRE to receive this lead.");
        return;
    }

    // Pick the one with the lowest leads_today for fairness
    eligibleUsers.sort((a, b) => (a.leads_today || 0) - (b.leads_today || 0));
    const newRecipient = eligibleUsers[0];

    console.log(`- Selected New Recipient: ${newRecipient.name} (Plan: ${newRecipient.plan_name}, Current Leads: ${newRecipient.leads_today || 0})`);

    // 5. Reassign the Lead
    const now = new Date().toISOString();
    console.log("- Updating Lead record...");
    await supabase.from('leads').update({
        assigned_to: newRecipient.id,
        user_id: newRecipient.id,
        assigned_at: now
    }).eq('id', leadToReassign.id);

    // 6. Update user counts
    console.log("- Adjusting Daily Lead Counts...");
    const oldLeadsToday = Math.max(0, (userToDeactivate.leads_today || 0) - 1);
    await supabase.from('users').update({ leads_today: oldLeadsToday }).eq('id', userToDeactivate.id);

    const newLeadsToday = (newRecipient.leads_today || 0) + 1;
    await supabase.from('users').update({ leads_today: newLeadsToday }).eq('id', newRecipient.id);

    // 7. Notification
    console.log("- Sending Notification to new recipient...");
    await supabase.from('notifications').insert({
        user_id: newRecipient.id,
        title: 'Reassigned Chirag Meta Lead',
        message: `Lead: ${leadToReassign.name || 'Unknown'} has been reassigned to you.`,
        type: 'lead_assignment'
    });

    console.log("\n🎉 Reassignment successfully complete!");
}

main().catch(console.error);
