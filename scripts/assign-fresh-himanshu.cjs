const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

const TEAM_ID = 'TEAMFIRE';

async function assignFreshLeads() {
    console.log('--- Assigning Fresh Himanshu Leads ---');

    // 1. Fetch Fresh Leads
    const { data: leads, error: lErr } = await supabase
        .from('leads')
        .select('id, name')
        .ilike('source', '%Himanshu%')
        .eq('status', 'Fresh')
        .gte('created_at', new Date().toISOString().split('T')[0] + 'T00:00:00.000Z');

    if (lErr || !leads || leads.length === 0) {
        console.error('No fresh leads found or error:', lErr || 'No leads');
        return;
    }

    console.log(`Found ${leads.length} fresh leads to assign.`);

    // 2. Fetch Eligible Members (0 leads today, paid, active)
    const { data: users, error: uErr } = await supabase
        .from('users')
        .select('id, name, leads_today')
        .eq('team_code', TEAM_ID)
        .eq('is_active', true)
        .eq('payment_status', 'active')
        .eq('leads_today', 0);

    if (uErr || !users || users.length === 0) {
        console.error('No members with 0 leads found or error:', uErr || 'No users');
        return;
    }

    console.log(`Found ${users.length} eligible users.`);

    // 3. Assignment Logic (Round Robin)
    let assignedCount = 0;
    let userIdx = 0;

    for (const lead of leads) {
        const targetUser = users[userIdx % users.length];
        userIdx++;

        const { error: upLeadErr } = await supabase.from('leads').update({
            status: 'Assigned',
            assigned_to: targetUser.id,
            user_id: targetUser.id,
            assigned_at: new Date().toISOString(),
            notes: 'Batch assignment for zero-lead users'
        }).eq('id', lead.id);

        if (!upLeadErr) {
            assignedCount++;

            // Increment user counter
            const newCount = (targetUser.leads_today || 0) + 1;
            targetUser.leads_today = newCount;
            await supabase.from('users').update({ leads_today: newCount }).eq('id', targetUser.id);

            console.log(`✅ Assigned ${lead.name} -> ${targetUser.name}`);
        } else {
            console.error(`Failed to assign lead ${lead.id}:`, upLeadErr.message);
        }
    }

    console.log(`--- FINISHED ---`);
    console.log(`Total Leads Assigned: ${assignedCount}`);
}

assignFreshLeads();
