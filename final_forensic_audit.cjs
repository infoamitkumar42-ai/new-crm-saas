
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://vewqzsqddgmkslnuctvb.supabase.co';
const SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDUzMDQ2MiwiZXhwIjoyMDgwMTA2NDYyfQ.pAgMGN6MtKm1A3fsKr1GIt8-qmKYhwFjSt92L_6_7us";

const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

const QUOTA_MAP = {
    '999': 55,
    '1999_sup': 115,
    '1999_web': 92,
    '2499': 108,
    '2999': 176
};

async function forensicAudit() {
    console.log("🕵️‍♂️ FORENSIC AUDIT: Verifying Total Lead Quotas vs History...");

    // 1. Get all active users in Team Himanshu
    const { data: users } = await supabase.from('users')
        .select('id, name, email, is_active')
        .eq('team_code', 'TEAMFIRE')
        .eq('is_active', true);

    // 2. Fetch all captured payments
    const { data: allPayments } = await supabase.from('payments')
        .select('amount, user_id, raw_payload, created_at')
        .eq('status', 'captured');

    console.log(`Auditing ${users.length} active users against all history...`);

    const report = [];

    for (const u of users) {
        // Find ALL payments for this user (By ID or Email in payload)
        const userPays = allPayments.filter(p => {
            if (p.user_id === u.id) return true;
            const payEmail = p.raw_payload?.email || p.raw_payload?.notes?.email;
            return payEmail && payEmail.toLowerCase() === u.email?.toLowerCase();
        });

        let totalQuota = 0;
        let lastPaymentDate = 'None';

        if (userPays.length > 0) {
            userPays.forEach(p => {
                const amt = p.amount.toString();
                if (amt === '1999') {
                    const desc = JSON.stringify(p.raw_payload).toLowerCase();
                    totalQuota += desc.includes('weekly') ? QUOTA_MAP['1999_web'] : QUOTA_MAP['1999_sup'];
                } else if (QUOTA_MAP[amt]) {
                    totalQuota += QUOTA_MAP[amt];
                } else {
                    if (amt >= 2499) totalQuota += 108;
                    else if (amt >= 999) totalQuota += 55;
                }
            });
            totalQuota += 5; // Welcome Bonus once

            // Sort to find latest
            const sorted = userPays.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
            lastPaymentDate = new Date(sorted[0].created_at).toLocaleDateString();
        }

        // Get Lifetime Assigned Leads
        const { count: lifetimeAssigned } = await supabase.from('leads')
            .select('*', { count: 'exact', head: true })
            .eq('assigned_to', u.id);

        const currentBalance = totalQuota - lifetimeAssigned;

        // Add to result
        report.push({
            Name: u.name,
            Email: u.email,
            'Total Pay Count': userPays.length,
            'Last Paid On': lastPaymentDate,
            'Paid Quota (Leads)': totalQuota,
            'Received So Far': lifetimeAssigned,
            'PENDING BALANCE': currentBalance,
            'Status': currentBalance > 0 ? '✅ STILL OWED' : '🚫 OVER-LEADED'
        });
    }

    // Sort by Balance to show who is "Safe" vs "Leak"
    report.sort((a, b) => a['PENDING BALANCE'] - b['PENDING BALANCE']);

    console.log("\n📊 FULL AUDIT RESULTS (Ordered by Balance):");
    console.table(report.map(r => ({
        Name: r.Name,
        Email: r.Email,
        Pays: r['Total Pay Count'],
        Quota: r['Paid Quota (Leads)'],
        Got: r['Received So Far'],
        Bal: r['PENDING BALANCE'],
        Verdict: r.Status
    })));
}

forensicAudit();
