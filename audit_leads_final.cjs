
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://vewqzsqddgmkslnuctvb.supabase.co';
const SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDUzMDQ2MiwiZXhwIjoyMDgwMTA2NDYyfQ.pAgMGN6MtKm1A3fsKr1GIt8-qmKYhwFjSt92L_6_7us";

const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

const QUOTA_MAP = {
    '999': 55,       // Starter
    '1999_sup': 115, // Supervisor
    '1999_web': 92,  // Weekly Boost
    '2499': 108,     // Turbo Boost
    '2999': 176      // Manager
};

async function auditor() {
    console.log("🕵️‍♂️ ADVANCED LEAD AUDIT: Summing All Payments & Leads...");

    // 1. Fetch Users
    const { data: users } = await supabase.from('users')
        .select('id, name, email, phone')
        .eq('is_active', true)
        .eq('team_code', 'TEAMFIRE');

    // 2. Fetch ALL Payments (to avoid N queries)
    const { data: allPayments } = await supabase.from('payments')
        .select('amount, created_at, user_id, raw_payload')
        .eq('status', 'captured');

    console.log(`Processing ${users.length} users against ${allPayments.length} payments...`);

    const report = [];

    for (const u of users) {
        // Find matching payments
        const userPays = allPayments.filter(p => {
            if (p.user_id === u.id) return true;
            const payEmail = p.raw_payload?.email || p.raw_payload?.notes?.email;
            if (payEmail && payEmail.toLowerCase() === u.email?.toLowerCase()) return true;
            return false;
        });

        let totalQuota = 0;
        if (userPays.length > 0) {
            userPays.forEach(p => {
                const amt = p.amount.toString();
                // Check if Weekly Boost (₹1999)
                if (amt === '1999') {
                    const isWeekly = JSON.stringify(p.raw_payload).toLowerCase().includes('weekly');
                    totalQuota += isWeekly ? QUOTA_MAP['1999_web'] : QUOTA_MAP['1999_sup'];
                } else if (QUOTA_MAP[amt]) {
                    totalQuota += QUOTA_MAP[amt];
                } else {
                    // Estimation for odd amounts
                    if (amt >= 2499) totalQuota += 108;
                    else if (amt >= 999) totalQuota += 55;
                }
            });
            totalQuota += 5; // Welcome Bonus
        }

        // Get Lifetime Leads
        const { count: leadsUsed } = await supabase.from('leads')
            .select('*', { count: 'exact', head: true })
            .eq('assigned_to', u.id);

        const remaining = totalQuota - leadsUsed;

        if (remaining <= 0 || totalQuota === 0) {
            report.push({
                Name: u.name,
                Email: u.email,
                'Pay Count': userPays.length,
                'Total Quota': totalQuota,
                'Leads Used': leadsUsed,
                'Remaining': remaining
            });
        }
    }

    report.sort((a, b) => a.Remaining - b.Remaining);

    console.log("\n🛑 LIST AT-RISK (Quota Finished):");
    console.table(report.slice(0, 30));
    console.log(`... Total ${report.length} people are out of leads.`);
}

auditor();
