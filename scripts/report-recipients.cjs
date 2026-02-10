const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function runReport() {
    console.log('--- GENERATING DETAILED REPORT (59 RECIPIENTS) ---');
    const today = new Date().toISOString().split('T')[0] + 'T00:00:00.000Z';

    // 1. Fetch Users in Himanshu Team
    const { data: users } = await supabase.from('users').select('*').eq('team_code', 'TEAMFIRE').eq('is_active', true);
    const { data: payments } = await supabase.from('payments').select('*');
    const { data: leads } = await supabase.from('leads').select('*').gte('created_at', today).ilike('source', '%Himanshu%');

    const recipientsAudit = users.map(u => {
        const userLeads = leads.filter(l => l.assigned_to === u.id);
        if (userLeads.length === 0 && u.leads_today === 0) return null;

        const pMatch = payments.find(p =>
            p.user_id === u.id ||
            p.payer_email === u.email ||
            (p.raw_payload && JSON.stringify(p.raw_payload).toLowerCase().includes(u.email.toLowerCase())) ||
            (p.raw_payload && JSON.stringify(p.raw_payload).toLowerCase().includes(u.name.toLowerCase()))
        );

        return {
            name: u.name,
            email: u.email,
            leadsAssignedToday: userLeads.length,
            leadsReportedInCounter: u.leads_today,
            isPaid: !!pMatch,
            paymentDetail: pMatch ? (pMatch.payer_email || pMatch.amount || 'Record Found') : '--- MISSING ---',
            plan: u.plan_name
        };
    }).filter(x => x !== null);

    console.log('\n--- AUDIT OF 59 RECIPIENTS ---');
    console.table(recipientsAudit.sort((a, b) => (a.isPaid === b.isPaid) ? (b.leadsAssignedToday - a.leadsAssignedToday) : (a.isPaid ? 1 : -1)));

    const freshLeads = leads.filter(l => l.status === 'Fresh');
    const assignedLeads = leads.filter(l => l.status === 'Assigned');

    console.log('\n--- LEAD STATUS SUMMARY (HIMANSHU SOURCE) ---');
    console.log(`Total Leads in CRM Today: ${leads.length}`);
    console.log(`Still Fresh (Unassigned): ${freshLeads.length}`);
    console.log(`Total Assigned Today: ${assignedLeads.length}`);
}

runReport();
