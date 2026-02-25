const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const SUPABASE_URL = "https://vewqzsqddgmkslnuctvb.supabase.co";
const SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDUzMDQ2MiwiZXhwIjoyMDgwMTA2NDYyfQ.pAgMGN6MtKm1A3fsKr1GIt8-qmKYhwFjSt92L_6_7us";
const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

const PLAN_LIMITS = {
    'starter': 50,
    'weekly_boost': 100,
    'manager': 200,
    'supervisor': 150,
    'turbo_boost': 250
};

async function main() {
    console.log("📊 Generating TEAMFIRE February Quota Report... Please wait.\n");

    const TEAM_CODE = 'GJ01TEAMFIRE';
    const feb1st = new Date('2026-02-01T00:00:00.000Z');

    // 1. Fetch ALL users in TEAMFIRE
    const { data: users, error: uErr } = await supabase
        .from('users')
        .select('id, name, email, plan_name, is_active, created_at')
        .eq('team_code', TEAM_CODE)
        .order('name');

    if (uErr) {
        console.error("Error fetching users:", uErr.message);
        return;
    }

    // 2. Fetch all payments for these users
    const userIds = users.map(u => u.id);
    const { data: payments, error: pErr } = await supabase
        .from('payments')
        .select('user_id, created_at')
        .eq('status', 'captured')
        .in('user_id', userIds)
        .order('created_at', { ascending: false });

    if (pErr) console.error("Error fetching payments:", pErr.message);

    const latestPayments = {};
    if (payments) {
        for (let p of payments) {
            if (!latestPayments[p.user_id]) {
                latestPayments[p.user_id] = new Date(p.created_at);
            }
        }
    }

    const reportData = [];

    // 3. Process each user
    for (const u of users) {
        const lastPayDate = latestPayments[u.id] || new Date(u.created_at);

        // Skip users whose last payment/creation was WAY before February and they are inactive
        if (lastPayDate < feb1st && !u.is_active) continue;

        const limit = PLAN_LIMITS[u.plan_name] || 9999;

        // 4. Fetch leads assigned since last pay date
        const { data: leads } = await supabase
            .from('leads')
            .select('id')
            .eq('assigned_to', u.id)
            .gte('created_at', lastPayDate.toISOString());

        const delivered = leads ? leads.length : 0;
        const pending = Math.max(0, limit - delivered);
        let flag = "";

        if (u.is_active && delivered >= limit) {
            flag = "SHOULD BE STOPPED (Quota Full but Active)";
        } else if (!u.is_active && delivered < limit) {
            flag = "STOPPED EARLY (Pending Leads but Inactive)";
        } else if (u.is_active && delivered < limit) {
            flag = "NORMAL (Active & Receiving)";
        } else if (!u.is_active && delivered >= limit) {
            flag = "COMPLETED (Inactive & Quota Full)";
        }

        reportData.push({
            name: u.name,
            email: u.email,
            is_active: u.is_active ? 'Yes' : 'No',
            plan: u.plan_name,
            pay_date: lastPayDate.toISOString().split('T')[0],
            promised: limit === 9999 ? 'Unknown' : limit,
            delivered: delivered,
            pending: limit === 9999 ? 'Unknown' : pending,
            status_flag: flag
        });
    }

    // 5. Generate CSV
    let csvContent = "Name,Email,Is Active,Plan,Calculation Start Date,Promised Leads,Delivered Leads,Pending Leads,Status & Recommendation\n";

    // Sort by status flag to bring issues to the top
    reportData.sort((a, b) => {
        if (a.status_flag.includes("SHOULD BE STOPPED")) return -1;
        if (b.status_flag.includes("SHOULD BE STOPPED")) return 1;
        if (a.status_flag.includes("STOPPED EARLY")) return -1;
        if (b.status_flag.includes("STOPPED EARLY")) return 1;
        return 0;
    });

    for (let row of reportData) {
        csvContent += `"${row.name}","${row.email}","${row.is_active}","${row.plan}","${row.pay_date}","${row.promised}","${row.delivered}","${row.pending}","${row.status_flag}"\n`;
    }

    fs.writeFileSync('teamfire_feb_quota_report.csv', csvContent);

    // 6. Print Summary
    const shouldBeStopped = reportData.filter(r => r.status_flag.includes("SHOULD BE STOPPED")).length;
    const stoppedEarly = reportData.filter(r => r.status_flag.includes("STOPPED EARLY")).length;
    const activeReceiving = reportData.filter(r => r.status_flag.includes("NORMAL")).length;
    const completed = reportData.filter(r => r.status_flag.includes("COMPLETED")).length;

    console.log("✅ CSV Report Generated Successfully: teamfire_feb_quota_report.csv");
    console.log("\n--- QUICK SUMMARY ---");
    console.log(`Total Users Analysed: ${reportData.length}`);
    console.log(`- Active Users needing to be STOPPED (Quota Full): ${shouldBeStopped}`);
    console.log(`- Inactive Users with PENDING LEADS: ${stoppedEarly}`);
    console.log(`- Active Users correctly receiving leads: ${activeReceiving}`);
    console.log(`- Inactive Users correctly completed: ${completed}`);
}

main().catch(console.error);
