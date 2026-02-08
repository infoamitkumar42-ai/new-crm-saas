
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://vewqzsqddgmkslnuctvb.supabase.co';
const SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDUzMDQ2MiwiZXhwIjoyMDgwMTA2NDYyfQ.pAgMGN6MtKm1A3fsKr1GIt8-qmKYhwFjSt92L_6_7us";

const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

// Define Exact Quotas from Image
const PLAN_MAP = {
    '999': { name: 'Starter', total: 55 },
    '1999_supervisor': { name: 'Supervisor', total: 115 },
    '2999': { name: 'Manager', total: 176 },
    '1999_weekly_boost': { name: 'Weekly Boost', total: 92 },
    '2499': { name: 'Turbo Boost', total: 108 }
};

async function deepLeadAudit() {
    console.log("🕵️‍♂️ DETAILED LEAD QUOTA AUDIT (Based on Price & Plan Name)...");

    const { data: users } = await supabase.from('users')
        .select('id, name, email, is_active, team_code, created_at')
        .eq('is_active', true)
        .eq('team_code', 'TEAMFIRE');

    if (!users) return;

    console.log(`Auditing ${users.length} Active users in TEAMFIRE...\n`);
    const finalReport = [];

    for (const u of users) {
        // 1. Get All Captured Payments
        const { data: payments } = await supabase.from('payments')
            .select('amount, created_at, plan_name')
            .eq('status', 'captured')
            .or(`user_id.eq.${u.id},user_email.eq.${u.email}`);

        let totalQuota = 0;

        if (payments && payments.length > 0) {
            payments.forEach(p => {
                const amt = p.amount.toString();
                const pName = (p.plan_name || '').toLowerCase();

                if (amt === '1999') {
                    if (pName.includes('weekly')) {
                        totalQuota += PLAN_MAP['1999_weekly_boost'].total;
                    } else {
                        // Default to Supervisor if unsure
                        totalQuota += PLAN_MAP['1999_supervisor'].total;
                    }
                } else if (PLAN_MAP[amt]) {
                    totalQuota += PLAN_MAP[amt].total;
                } else {
                    // Fallback for odd amounts
                    if (amt >= 2499) totalQuota += 108;
                    else if (amt >= 999) totalQuota += 55;
                }
            });

            // Add Welcome Bonus (First payment)
            totalQuota += 5;
        }

        // 2. Get Lifetime Leads
        const { count: lifetimeLeads } = await supabase.from('leads')
            .select('*', { count: 'exact', head: true })
            .eq('assigned_to', u.id);

        const remaining = totalQuota - lifetimeLeads;

        // 3. Only add to report if they are over quota or close to it
        if (remaining <= 5 || totalQuota === 0) {
            finalReport.push({
                Name: u.name,
                Email: u.email,
                Payments: payments?.length || 0,
                TotalQuota: totalQuota,
                Used: lifetimeLeads,
                Remaining: remaining,
                Verdict: totalQuota === 0 ? '🔴 NO PAYMENT' : (remaining <= 0 ? '🚫 EXPIRED' : '⚠️ NEAR LIMIT')
            });
        }
    }

    finalReport.sort((a, b) => a.Remaining - b.Remaining);

    console.log("🛑 USERS EXCEEDING OR FINISHING QUOTA:");
    console.table(finalReport);

    console.log(`\nFound ${finalReport.filter(r => r.Remaining <= 0).length} users to STOP.`);
}

deepLeadAudit();
