const { createClient } = require('@supabase/supabase-js');

// HARDCODED CREDENTIALS
const SUPABASE_URL = 'https://vewqzsqddgmkslnuctvb.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDUzMDQ2MiwiZXhwIjoyMDgwMTA2NDYyfQ.pAgMGN6MtKm1A3fsKr1GIt8-qmKYhwFjSt92L_6_7us';
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const PLAN_LIMITS = {
    'starter': 55,
    'supervisor': 115,
    'manager': 176,
    'weekly_boost': 92,
    'turbo_boost': 108
};

async function auditUsers() {
    console.log('--- 🔍 DEEP AUDIT: MULTI-PAYMENT & STUCK USERS ---\n');

    // 1. Fetch All Users with a Plan
    const { data: users, error } = await supabase
        .from('users')
        .select('id, name, email, plan_name, total_leads_promised, total_leads_received, is_plan_pending, is_active, payment_status, daily_limit')
        .neq('plan_name', 'none')
        .not('plan_name', 'is', null);

    if (error) {
        console.error('Error fetching users:', error);
        return;
    }

    console.log(`Scanning ${users.length} users...\n`);

    const issues = [];

    for (const user of users) {
        // A. Get Captured Payments
        const { data: payments } = await supabase
            .from('payments')
            .select('created_at, status')
            .eq('user_id', user.id)
            .eq('status', 'captured');

        const payCount = payments ? payments.length : 0;

        // Skip if no payments (might be trial or old data we don't care about here)
        if (payCount === 0) continue;

        const baseLimit = PLAN_LIMITS[user.plan_name.toLowerCase()] || 0;
        const expectedTotalQuota = baseLimit * payCount;
        const currentPromised = user.total_leads_promised || 0;

        let hasIssue = false;
        let reasons = [];

        // ISSUE 1: Quota Mismatch (Manual lock smaller than reality)
        // If currentPromised is set (not 0) and it's less than what they paid for
        if (currentPromised > 0 && currentPromised < expectedTotalQuota) {
            hasIssue = true;
            reasons.push(`Quota Mismatch: Promised ${currentPromised} but Paid for ${payCount} plans (${expectedTotalQuota} leads)`);
        }

        // If currentPromised is 0, enforce_smart_quota already calculates it dynamically, 
        // so that's actually FINE unless the user is still stopped.

        // ISSUE 2: Stuck Pending
        // If is_plan_pending is true but they have a captured payment older than 3 hours
        const lastPay = payments.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))[0];
        const lastPayDate = new Date(lastPay.created_at);
        const hoursSincePay = (Date.now() - lastPayDate.getTime()) / (1000 * 60 * 60);

        if (user.is_plan_pending && hoursSincePay > 3) {
            hasIssue = true;
            reasons.push(`Stuck Pending: Status is 'Pending' but last payment was ${Math.round(hoursSincePay)} hours ago`);
        }

        // ISSUE 3: Stopped but has quota
        // We calculate dynamic quota if promised is 0
        const activeQuota = currentPromised > 0 ? currentPromised : expectedTotalQuota;
        const received = user.total_leads_received || 0;
        if (!user.is_active && received < activeQuota) {
            hasIssue = true;
            reasons.push(`Prematurely Stopped: Inactive but has ${activeQuota - received} leads remaining`);
        }

        if (hasIssue) {
            issues.push({
                name: user.name,
                email: user.email,
                reasons: reasons,
                details: {
                    plan: user.plan_name,
                    payments: payCount,
                    promised: currentPromised,
                    received: received,
                    expected: expectedTotalQuota
                }
            });
        }
    }

    // Output Report
    if (issues.length === 0) {
        console.log('✅ All good! No stuck users found.');
    } else {
        console.log(`❌ FOUND ${issues.length} USERS WITH POTENTIAL ISSUES:\n`);
        issues.forEach((issue, idx) => {
            console.log(`${idx + 1}. ${issue.name} (${issue.email})`);
            issue.reasons.forEach(r => console.log(`   - ${r}`));
            console.log(`     [Status: ${issue.details.plan} | Pay: ${issue.details.payments} | Promise: ${issue.details.promised} | Recv: ${issue.details.received}]\n`);
        });
    }
}

auditUsers();
