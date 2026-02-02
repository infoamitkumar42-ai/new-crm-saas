const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://vewqzsqddgmkslnuctvb.supabase.co';
const ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ1MzA0NjIsImV4cCI6MjA4MDEwNjQ2Mn0.g-e8YNzEy0Z5ul1RGAhBMDj41TtWGuNPEzZz4XEGPg4";

const supabase = createClient(SUPABASE_URL, ANON_KEY);

// Plan Limits
const PLAN_LIMITS = {
    'starter': 55,
    'supervisor': 115,
    'manager': 176,
    'weekly_boost': 92,
    'turbo_boost': 108
};

async function fullDatabaseAudit() {
    console.log("🔍 FULL DATABASE AUDIT - ALL TABLES\n");
    console.log("=".repeat(80));

    // 1. FETCH ALL DATA
    console.log("\n📥 Fetching all data...\n");

    const [usersRes, leadsRes, paymentsRes] = await Promise.all([
        supabase.from('users').select('*').neq('plan_name', 'none'),
        supabase.from('leads').select('id, user_id, assigned_to, created_at'),
        supabase.from('payments').select('id, user_id, amount, status, created_at').eq('status', 'captured')
    ]);

    const users = usersRes.data || [];
    const leads = leadsRes.data || [];
    const payments = paymentsRes.data || [];

    console.log(`📊 RAW DATA COUNTS:`);
    console.log(`   Users with Plan:  ${users.length}`);
    console.log(`   Total Leads:      ${leads.length}`);
    console.log(`   Total Payments:   ${payments.length}`);

    // 2. BUILD MAPS
    const leadCountMap = new Map();
    leads.forEach(l => {
        const id = l.user_id || l.assigned_to;
        if (id) leadCountMap.set(id, (leadCountMap.get(id) || 0) + 1);
    });

    const paymentMap = new Map();
    payments.forEach(p => {
        if (!paymentMap.has(p.user_id)) paymentMap.set(p.user_id, []);
        paymentMap.get(p.user_id).push(p);
    });

    // 3. CATEGORIZE USERS
    let activeUsers = [];
    let stoppedUsers = [];

    users.forEach(u => {
        const actualLeads = leadCountMap.get(u.id) || 0;
        const userPayments = paymentMap.get(u.id) || [];
        const limit = PLAN_LIMITS[u.plan_name] || 55;
        const isQuotaComplete = actualLeads >= limit;

        const userData = {
            name: u.name,
            plan: u.plan_name,
            isActive: u.is_active,
            dbLeads: u.total_leads_received || 0,
            actualLeads: actualLeads,
            limit: limit,
            payments: userPayments.length,
            quotaComplete: isQuotaComplete
        };

        if (u.is_active) {
            activeUsers.push(userData);
        } else {
            stoppedUsers.push(userData);
        }
    });

    // 4. PRINT STOPPED USERS
    console.log("\n" + "=".repeat(80));
    console.log(`🛑 STOPPED USERS (is_active=false): ${stoppedUsers.length}`);
    console.log("=".repeat(80));
    console.log(`| #  | Name                   | Plan         | Actual | Limit | Quota Done? | Payments |`);
    console.log(`|----|------------------------|--------------|--------|-------|-------------|----------|`);

    let quotaCompleteCount = 0;
    let quotaPendingCount = 0;

    stoppedUsers.forEach((u, i) => {
        const status = u.quotaComplete ? '✅ YES' : '❌ NO';
        if (u.quotaComplete) quotaCompleteCount++;
        else quotaPendingCount++;

        console.log(`| ${String(i + 1).padEnd(2)} | ${u.name.padEnd(22)} | ${u.plan.padEnd(12)} | ${String(u.actualLeads).padEnd(6)} | ${String(u.limit).padEnd(5)} | ${status.padEnd(11)} | ${String(u.payments).padEnd(8)} |`);
    });

    // 5. PRINT ACTIVE USERS
    console.log("\n" + "=".repeat(80));
    console.log(`✅ ACTIVE USERS (is_active=true): ${activeUsers.length}`);
    console.log("=".repeat(80));
    console.log(`| #  | Name                   | Plan         | Actual | Limit | Quota Done? | Payments |`);
    console.log(`|----|------------------------|--------------|--------|-------|-------------|----------|`);

    activeUsers.forEach((u, i) => {
        const status = u.quotaComplete ? '✅ YES' : '❌ NO';
        console.log(`| ${String(i + 1).padEnd(2)} | ${u.name.padEnd(22)} | ${u.plan.padEnd(12)} | ${String(u.actualLeads).padEnd(6)} | ${String(u.limit).padEnd(5)} | ${status.padEnd(11)} | ${String(u.payments).padEnd(8)} |`);
    });

    // 6. FINAL SUMMARY
    console.log("\n" + "=".repeat(80));
    console.log("📊 FINAL SUMMARY");
    console.log("=".repeat(80));
    console.log(`Total Users with Plan:     ${users.length}`);
    console.log(`Active Users:              ${activeUsers.length}`);
    console.log(`Stopped Users:             ${stoppedUsers.length}`);
    console.log(`─────────────────────────────────────────`);
    console.log(`Stopped + Quota Complete:  ${quotaCompleteCount}`);
    console.log(`Stopped + Quota Pending:   ${quotaPendingCount}`);
    console.log(`─────────────────────────────────────────`);
    console.log(`Total Leads in System:     ${leads.length}`);
    console.log(`Total Payments:            ${payments.length}`);
}

fullDatabaseAudit();
