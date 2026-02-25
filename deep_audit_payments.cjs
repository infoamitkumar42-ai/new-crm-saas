const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const SUPABASE_URL = "https://vewqzsqddgmkslnuctvb.supabase.co";
const SUPABASE_SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDUzMDQ2MiwiZXhwIjoyMDgwMTA2NDYyfQ.pAgMGN6MtKm1A3fsKr1GIt8-qmKYhwFjSt92L_6_7us";

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function deepAudit() {
    console.log("🕵️ DEEP AUDIT: VERIFYING PAYMENTS (CORRECTED TABLE)...");

    // 1. Fetch Users with Leads > 10
    const { data: users, error } = await supabase
        .from('users')
        .select('id, name, email, phone, team_code, plan_name, total_leads_received, created_at')
        .gt('total_leads_received', 10)
        .order('total_leads_received', { ascending: false });

    if (error) { console.error("Error:", error); return; }

    console.log(`🔍 Checking ${users.length} users against 'payments' table...`);

    let csvContent = "Name,Email,Phone,Team,Total Leads,Plan,Total Amount Paid,Payment Count,Last Payment Date,Risk Status\n";
    let anomalyCount = 0;
    let verifiedPaidCount = 0;

    for (const user of users) {
        // 2. Check 'payments' table (The REAL table)
        const { data: payments } = await supabase
            .from('payments')
            .select('amount, created_at, status')
            .eq('user_id', user.id);

        // Filter for successful payments
        const successfulPayments = (payments || []).filter(p =>
            p.status === 'captured' ||
            p.status === 'success' ||
            p.status === 'paid' ||
            p.status === 'authorized'
        );

        const totalPaid = successfulPayments.reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0);
        const paymentCount = successfulPayments.length;
        const lastPayment = successfulPayments.length > 0 ? new Date(successfulPayments[0].created_at).toLocaleDateString() : 'N/A';

        let riskStatus = "SAFE";

        if (paymentCount === 0) {
            // No trace in payments table
            // Double check: active plan?
            if (user.plan_name && user.plan_name !== 'none') {
                riskStatus = "HIGH (Active Plan but No System Payment)";
            } else {
                riskStatus = "HIGH (Leads Received but No Payment)";
            }
            anomalyCount++;
        } else {
            // Has paid
            riskStatus = "PAID VERIFIED";
            verifiedPaidCount++;
        }

        // Add to CSV
        // Only include Anomalies in the main list, or everything? 
        // User asked for "audit", implying they want to see the anomalies clearly.
        // Let's list everyone but sort anomalies to top?
        // Actually, user said "160 logo ki payments full audit krke do".

        const row = [
            `"${user.name || 'Unknown'}"`,
            user.email,
            user.phone || 'N/A',
            user.team_code || 'N/A',
            user.total_leads_received,
            user.plan_name || 'None',
            totalPaid,
            paymentCount,
            lastPayment,
            riskStatus
        ].join(",");

        csvContent += row + "\n";
    }

    const filePath = path.join(__dirname, 'CORRECTED_PAYMENT_AUDIT_V2.csv');
    fs.writeFileSync(filePath, csvContent);

    console.log(`✅ REPORT GENERATED: ${filePath}`);
    console.log(`📊 Summary:`);
    console.log(`   - Verified Paid Users: ${verifiedPaidCount}`);
    console.log(`   - Potential Anomalies (Zero Payments): ${anomalyCount}`);
}

deepAudit();
