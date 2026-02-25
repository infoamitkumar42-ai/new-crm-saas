const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const SUPABASE_URL = "https://vewqzsqddgmkslnuctvb.supabase.co";
const SUPABASE_SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDUzMDQ2MiwiZXhwIjoyMDgwMTA2NDYyfQ.pAgMGN6MtKm1A3fsKr1GIt8-qmKYhwFjSt92L_6_7us";

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function generateFullReport() {
    console.log("📊 GENERATING FULL REPORT FOR TEAMFIRE (ALL USERS)...");

    // 1. Fetch ALL Users in TEAMFIRE
    const { data: users, error } = await supabase
        .from('users')
        .select('id, name, email, phone, total_leads_received, plan_name, is_active, created_at')
        .eq('team_code', 'TEAMFIRE')
        .order('name');

    if (error) { console.error("Error fetching users:", error); return; }

    console.log(`🔍 Processing ${users.length} members...`);

    let csvContent = "Name,Email,Phone,Status,Total Leads,Total Paid (Real),Last Payment Date,Plan,Risk Analysis\n";

    for (const user of users) {
        // 2. Fetch Payments
        const { data: payments } = await supabase
            .from('payments')
            .select('amount, created_at, status')
            .eq('user_id', user.id)
            .or('status.eq.captured,status.eq.success,status.eq.paid');

        const totalPaid = (payments || []).reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0);
        const lastPaymentDate = payments && payments.length > 0 ? new Date(payments[0].created_at).toLocaleDateString() : 'Never';

        let risk = "SAFE";
        if (totalPaid === 0 && user.total_leads_received > 10) risk = "HIGH (Unpaid Leads)";
        if (totalPaid === 0 && user.is_active) risk = "CRITICAL (Active without Pay)";

        const status = user.is_active ? "ACTIVE" : "STOPPED";

        const row = [
            `"${user.name || 'Unknown'}"`,
            user.email,
            user.phone || 'N/A',
            status,
            user.total_leads_received,
            totalPaid,
            lastPaymentDate,
            user.plan_name || 'None',
            risk
        ].join(",");

        csvContent += row + "\n";
    }

    const filePath = path.join(__dirname, 'TEAMFIRE_FULL_REPORT.csv');
    fs.writeFileSync(filePath, csvContent);

    console.log(`✅ REPORT GENERATED: ${filePath}`);
    console.log(`   - Total Members: ${users.length}`);
}

generateFullReport();
