const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

const TEAM_CODE = 'TEAMFIRE';
const EXEMPT_EMAIL = 'sharmahimanshu9797@gmail.com';
const MANAGER_EMAIL = 'coach.himanshusharma@gmail.com';

async function runCleanup() {
    console.log('--- STARTING FINAL HIMANSHU CLEANUP ---');
    const todayStr = new Date().toISOString().split('T')[0] + 'T00:00:00.000Z';
    const febStart = '2026-02-01T00:00:00.000Z';

    // 1. Fetch Team Members
    const { data: users } = await supabase
        .from('users')
        .select('*')
        .eq('team_code', TEAM_CODE)
        .eq('is_active', true);

    if (!users) return;

    // 2. Fetch All Payments
    const { data: allPayments } = await supabase.from('payments').select('*').order('created_at', { ascending: false });

    // 3. Fetch All Leads Assigned Today (Himanshu Source)
    const { data: todaysLeads } = await supabase
        .from('leads')
        .select('*')
        .ilike('source', '%Himanshu%')
        .gte('created_at', todayStr);

    const report = [];
    const reclaimedLeadIds = [];
    const paidMemberIds = [];

    for (const user of users) {
        if (user.email === EXEMPT_EMAIL) {
            paidMemberIds.push(user.id);
            continue;
        }

        // Deep payment search
        const userPayments = allPayments.filter(p =>
            p.user_id === user.id ||
            p.payer_email === user.email ||
            (p.raw_payload && JSON.stringify(p.raw_payload).toLowerCase().includes(user.email.toLowerCase())) ||
            (p.raw_payload && JSON.stringify(p.raw_payload).toLowerCase().includes(user.name.toLowerCase()))
        );

        const febPayment = userPayments.find(p => p.created_at >= febStart);
        const lastPayment = userPayments[0];

        // Is it the manager account? (No leads for coach account)
        const isManager = user.email === MANAGER_EMAIL;

        if (febPayment && !isManager) {
            paidMemberIds.push(user.id);
            continue;
        }

        // ACTION: Reclaim Leads & Deactivate
        const userLeadsToday = todaysLeads.filter(l => l.assigned_to === user.id);
        if (userLeadsToday.length > 0) {
            reclaimedLeadIds.push(...userLeadsToday.map(l => l.id));
        }

        report.push({
            name: user.name,
            email: user.email,
            lastPayment: lastPayment ? lastPayment.created_at.split('T')[0] : 'NEVER',
            reason: isManager ? 'Manager Account' : 'No Feb Payment',
            leadsReclaimed: userLeadsToday.length
        });

        // Deactivate User
        await supabase.from('users').update({
            is_active: false,
            payment_status: 'inactive',
            valid_until: null,
            daily_limit: 0,
            leads_today: 0
        }).eq('id', user.id);
    }

    console.log(`\nReclaimed ${reclaimedLeadIds.length} leads from ${report.length} unpaid/unverified members.`);

    // 4. Update Reclaimed Leads to 'Queued' (Ready for redistribution)
    if (reclaimedLeadIds.length > 0) {
        await supabase.from('leads').update({
            status: 'Fresh',
            assigned_to: null,
            user_id: null,
            assigned_at: null,
            notes: 'Reclaimed from unpaid member'
        }).in('id', reclaimedLeadIds);
    }

    // 5. Redistribute to Paid Members
    let redistributedCount = 0;
    if (reclaimedLeadIds.length > 0 && paidMemberIds.length > 0) {
        console.log(`Redistributing to ${paidMemberIds.length} paid members...`);

        // Fetch paid members with their current leads_today
        const { data: paidUsers } = await supabase.from('users').select('id, name, leads_today').in('id', paidMemberIds);

        let userIdx = 0;
        for (const leadId of reclaimedLeadIds) {
            const targetUser = paidUsers[userIdx % paidUsers.length];
            userIdx++;

            const { error: upLeadErr } = await supabase.from('leads').update({
                status: 'Assigned',
                assigned_to: targetUser.id,
                user_id: targetUser.id,
                assigned_at: new Date().toISOString(),
                notes: 'Redistributed from unpaid cleanup'
            }).eq('id', leadId);

            if (!upLeadErr) {
                redistributedCount++;
                const newCount = (targetUser.leads_today || 0) + 1;
                targetUser.leads_today = newCount;
                await supabase.from('users').update({ leads_today: newCount }).eq('id', targetUser.id);
            }
        }
    }

    console.log(`Successfully redistributed ${redistributedCount} leads.`);
    console.table(report);
}

runCleanup();
