require('dns').setDefaultResultOrder('ipv4first');

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const SUPABASE_URL = 'https://vewqzsqddgmkslnuctvb.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDUzMDQ2MiwiZXhwIjoyMDgwMTA2NDYyfQ.pAgMGN6MtKm1A3fsKr1GIt8-qmKYhwFjSt92L_6_7us";

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

const PLAN_CONFIG = {
    starter: { price: 999, duration: 10, dailyLeads: 5, totalLeads: 50, weight: 1, maxReplacements: 5 },
    supervisor: { price: 1999, duration: 15, dailyLeads: 7, totalLeads: 105, weight: 3, maxReplacements: 10 },
    manager: { price: 2999, duration: 20, dailyLeads: 8, totalLeads: 160, weight: 5, maxReplacements: 16 },
    weekly_boost: { price: 1999, duration: 7, dailyLeads: 12, totalLeads: 84, weight: 7, maxReplacements: 8 },
    turbo_boost: { price: 2499, duration: 7, dailyLeads: 14, totalLeads: 98, weight: 9, maxReplacements: 10 }
};

function getPlanValues(planName) {
    if (!planName) return { promised: 0, replacements: 0, price: 0 };
    const p = planName.toLowerCase().replace(/[\s-]+/g, '_');
    if (PLAN_CONFIG[p]) return { promised: PLAN_CONFIG[p].totalLeads, replacements: PLAN_CONFIG[p].maxReplacements, price: PLAN_CONFIG[p].price };

    if (p.includes('turbo')) return { promised: 98, replacements: 10, price: 2499 };
    if (p.includes('weekly')) return { promised: 84, replacements: 8, price: 1999 };
    if (p.includes('manager')) return { promised: 160, replacements: 16, price: 2999 };
    if (p.includes('supervisor')) return { promised: 105, replacements: 10, price: 1999 };
    if (p.includes('starter')) return { promised: 50, replacements: 5, price: 999 };
    return { promised: 0, replacements: 0, price: 0 };
}

async function run() {
    console.log('Fetching users...');
    const { data: users, error: errU } = await supabase.from('users').select('*');
    if (errU) throw errU;
    console.log(`- Fetched ${users.length} users.`);

    console.log('Fetching payments...');
    const { data: allPayments, error: errP } = await supabase.from('payments').select('*').in('status', ['captured', 'success']);
    if (errP) throw errP;
    console.log(`- Fetched ${allPayments.length} successful payments.`);

    console.log('Fetching leads...');
    // We need all leads to count properly
    const { data: allLeads, error: errL } = await supabase.from('leads').select('source, assigned_to, assigned_at');
    if (errL) throw errL;
    console.log(`- Fetched ${allLeads.length} leads.`);

    const report = [];
    let summary = {
        totalUsers: users.length,
        activeUsers: 0,
        inactiveUsers: 0,
        needsReviewUsers: 0,
        totalPendingToDeliver: 0,
        revenueJan: 0,
        revenueFeb: 0
    };

    console.log('Processing data...');

    for (const user of users) {
        const userPayments = allPayments.filter(p => p.user_id === user.id);
        const userLeads = allLeads.filter(l => l.assigned_to === user.id && (!l.source || !l.source.toLowerCase().includes('orphan')));

        const janPayments = userPayments.filter(p => new Date(p.created_at).getMonth() === 0 && new Date(p.created_at).getFullYear() === 2026);
        const febPayments = userPayments.filter(p => new Date(p.created_at).getMonth() === 1 && new Date(p.created_at).getFullYear() === 2026);

        const sumAmount = arr => arr.reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0);

        const jan_payment_count = janPayments.length;
        const jan_amount_paid = sumAmount(janPayments);
        const jan_plan_names = janPayments.map(p => p.plan_name).join(' | ');

        const feb_payment_count = febPayments.length;
        const feb_amount_paid = sumAmount(febPayments);
        const feb_plan_names = febPayments.map(p => p.plan_name).join(' | ');

        summary.revenueJan += jan_amount_paid;
        summary.revenueFeb += feb_amount_paid;

        const total_payments_count = userPayments.length;
        const total_amount_paid = sumAmount(userPayments);

        let total_leads_promised = 0;
        let total_replacement_allowed = 0;

        if (total_payments_count > 0) {
            for (const p of userPayments) {
                const vals = getPlanValues(p.plan_name);
                total_leads_promised += vals.promised;
                total_replacement_allowed += vals.replacements;
            }
        } else if (user.is_active && user.plan_name && user.plan_name !== 'none') {
            const vals = getPlanValues(user.plan_name);
            total_leads_promised += vals.promised;
            total_replacement_allowed += vals.replacements;
        }

        const welcome_bonus_applicable = (total_payments_count > 0 || (user.is_active && user.plan_name && user.plan_name !== 'none')) ? 'yes' : 'no';
        const bonusAmount = welcome_bonus_applicable === 'yes' ? 5 : 0;

        const max_leads_entitled = total_leads_promised + total_replacement_allowed + bonusAmount;

        const janLeads = userLeads.filter(l => new Date(l.assigned_at).getMonth() === 0 && new Date(l.assigned_at).getFullYear() === 2026);
        const febLeads = userLeads.filter(l => new Date(l.assigned_at).getMonth() === 1 && new Date(l.assigned_at).getFullYear() === 2026);

        const total_leads_received_jan = janLeads.length;
        const total_leads_received_feb = febLeads.length;
        const total_leads_received_all = userLeads.length;

        const leads_pending_to_deliver = Math.max(0, max_leads_entitled - total_leads_received_all);

        const plan_expired_by_date = (user.valid_until && new Date() > new Date(user.valid_until)) ? 'yes' : 'no';
        const plan_limit_reached = (total_leads_received_all >= max_leads_entitled) ? 'yes' : 'no';

        let manual_activation = 'no';
        if (total_payments_count === 0 && user.is_active && user.plan_name && user.plan_name !== 'none') {
            manual_activation = 'yes';
        }

        let recommended_status = 'INACTIVE';
        let reason = [];

        if (manual_activation === 'yes') {
            recommended_status = 'NEEDS_REVIEW';
            reason.push('Manual activation (no payment record but active)');
        } else if (plan_expired_by_date === 'no' && plan_limit_reached === 'no' && max_leads_entitled > 0) {
            recommended_status = 'ACTIVE';
            reason.push('Has remaining quota and time limits');
        } else {
            recommended_status = 'INACTIVE';
            if (max_leads_entitled === 0) reason.push('No active plan');
            if (plan_expired_by_date === 'yes') reason.push('Time expired');
            if (plan_limit_reached === 'yes') reason.push('Quota reached');
            if (max_leads_entitled > 0 && total_leads_received_all < max_leads_entitled && plan_expired_by_date === 'yes') {
                reason.push('Quota remaining but plan expired');
            }
        }

        if (recommended_status === 'ACTIVE') {
            summary.activeUsers++;
        }
        if (recommended_status === 'INACTIVE') summary.inactiveUsers++;
        if (recommended_status === 'NEEDS_REVIEW') summary.needsReviewUsers++;

        if (max_leads_entitled > 0) {
            summary.totalPendingToDeliver += leads_pending_to_deliver;
        }

        report.push({
            user_id: user.id || '',
            user_name: user.name || '',
            phone: user.phone || '',
            email: user.email || '',
            role: user.role || '',
            jan_payment_count,
            jan_amount_paid,
            jan_plan_names,
            feb_payment_count,
            feb_amount_paid,
            feb_plan_names,
            total_payments_count,
            total_amount_paid,
            total_leads_promised,
            total_replacement_allowed,
            welcome_bonus_applicable,
            max_leads_entitled,
            total_leads_received_jan,
            total_leads_received_feb,
            total_leads_received_all,
            leads_pending_to_deliver,
            current_plan_name: user.plan_name || 'none',
            plan_start_date: user.plan_start_date ? new Date(user.plan_start_date).toISOString().split('T')[0] : '',
            plan_end_date: user.valid_until ? new Date(user.valid_until).toISOString().split('T')[0] : '',
            plan_expired_by_date,
            plan_limit_reached,
            manual_activation,
            recommended_status,
            reason: reason.join(' | ') || 'No reason specified'
        });
    }

    const headers = Object.keys(report[0]);
    const csvContent = [
        headers.join(','),
        ...report.map(r => headers.map(h => `"${String(r[h]).replace(/"/g, '""')}"`).join(','))
    ].join('\n');

    fs.writeFileSync('user_audit_report.csv', csvContent);

    console.log('\n--- SUMMARY ---');
    console.log(`Total users found: ${summary.totalUsers}`);
    console.log(`Total active users: ${summary.activeUsers}`);
    console.log(`Total inactive (should be stopped): ${summary.inactiveUsers}`);
    console.log(`Total needs review (manual UPI payments): ${summary.needsReviewUsers}`);
    console.log(`Total leads still pending to deliver: ${summary.totalPendingToDeliver}`);
    console.log(`Total revenue collected (Jan): Rs ${summary.revenueJan}`);
    console.log(`Total revenue collected (Feb): Rs ${summary.revenueFeb}`);
    console.log(`Total revenue collected (All Time): Rs ${summary.revenueJan + summary.revenueFeb}`);
    console.log(`✅ Saved complete report to user_audit_report.csv`);
}

run().catch(console.log);
