
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://vewqzsqddgmkslnuctvb.supabase.co';
const SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDUzMDQ2MiwiZXhwIjoyMDgwMTA2NDYyfQ.pAgMGN6MtKm1A3fsKr1GIt8-qmKYhwFjSt92L_6_7us";

const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

const QUOTAS = {
    '999': 55,
    '1999': 110,
    '2499': 150,
    '2999': 200
};

async function auditByLeads() {
    console.log("🕵️‍♂️ AUDITING BY LIFETIME LEAD QUOTAS...");

    // 1. Get All Active Users
    const { data: users } = await supabase.from('users')
        .select('id, name, email, is_active')
        .eq('is_active', true)
        .eq('team_code', 'TEAMFIRE');

    if (!users) return;

    console.log(`Analyzing ${users.length} users...`);
    const results = [];

    for (const u of users) {
        // A. Get All Payments for this user
        const { data: payments } = await supabase.from('payments')
            .select('amount')
            .eq('status', 'captured')
            .or(`user_id.eq.${u.id},user_email.eq.${u.email}`);

        // Calculate Total Paid Quota
        let totalQuota = 0;
        if (payments && payments.length > 0) {
            payments.forEach(p => {
                const amt = p.amount.toString();
                totalQuota += (QUOTAS[amt] || 55); // Default to 55 if amount slightly different
            });
        }

        // B. Get Lifetime Leads Assigned
        const { count: assignedCount } = await supabase.from('leads')
            .select('*', { count: 'exact', head: true })
            .eq('assigned_to', u.id);

        const remaining = totalQuota - assignedCount;

        results.push({
            Name: u.name,
            Email: u.email,
            Payments: payments?.length || 0,
            TotalQuota: totalQuota,
            LeadsAssigned: assignedCount,
            Remaining: remaining,
            Status: remaining <= 0 ? '🔴 STOP' : '✅ OK'
        });
    }

    // Sort to show who needs to be stopped first
    results.sort((a, b) => a.Remaining - b.Remaining);

    console.log("\n📊 LEAD QUOTA STATUS (Sample Top 20):");
    console.table(results.slice(0, 20));

    const countToStop = results.filter(r => r.Remaining <= 0).length;
    console.log(`\n🚨 FOUND ${countToStop} USERS WHO HAVE COMPLETED THEIR PAID LEADS.`);
}

auditByLeads();
