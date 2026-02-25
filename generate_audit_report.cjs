const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const SUPABASE_URL = "https://vewqzsqddgmkslnuctvb.supabase.co";
const SUPABASE_SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDUzMDQ2MiwiZXhwIjoyMDgwMTA2NDYyfQ.pAgMGN6MtKm1A3fsKr1GIt8-qmKYhwFjSt92L_6_7us";

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function generateAuditReport() {
    console.log("🕵️ GENERATING ANOMALY REPORT & VERIFYING PAYMENTS...");

    // 1. Fetch Users with Leads > 10
    const { data: users, error } = await supabase
        .from('users')
        .select('id, name, email, phone, team_code, plan_name, total_leads_received, created_at')
        .gt('total_leads_received', 10)
        .order('total_leads_received', { ascending: false });

    if (error) { console.error("Error:", error); return; }

    console.log(`🔍 Checking ${users.length} users...`);

    let csvContent = "Name,Email,Phone,Team,Total Leads,Plan,Last Payment Date,Amount Paid,Status\n";
    let count = 0;

    for (const user of users) {
        // Double Check: Fetch ANY payment record (Success or Attempted)
        const { data: payments } = await supabase
            .from('payment_history')
            .select('amount, payment_date, status')
            .eq('user_id', user.id)
            .or('status.eq.captured,status.eq.authorized,status.eq.success,status.eq.paid'); // Strict Success Check

        const hasValidPayment = payments && payments.length > 0;

        let paymentInfo = "NO RECORD";
        let amount = "0";

        if (hasValidPayment) {
            // User HAS paid. Skip them (Not an anomaly)
            continue;
        } else {
            // Re-check for ANY attempt (failed/pending) just to be sure
            const { data: attempts } = await supabase
                .from('payment_history')
                .select('status')
                .eq('user_id', user.id);

            if (attempts && attempts.length > 0) {
                paymentInfo = `Found ${attempts.length} FAILED/PENDING attempts`;
            }
        }

        // Add to Report
        count++;
        const row = [
            `"${user.name || 'Unknown'}"`,
            user.email,
            user.phone || 'N/A',
            user.team_code || 'N/A',
            user.total_leads_received,
            user.plan_name || 'None',
            paymentInfo,
            amount,
            "UNPAID LEADS DETECTED"
        ].join(",");

        csvContent += row + "\n";
    }

    // Write to File
    const filePath = path.join(__dirname, 'ANOMALY_REPORT_150_USERS.csv');
    fs.writeFileSync(filePath, csvContent);

    console.log(`✅ REPORT GENERATED: ${filePath}`);
    console.log(`⚠️ Found ${count} Users with ZERO successful payments but >10 Leads.`);
}

generateAuditReport();
