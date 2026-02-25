const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = "https://vewqzsqddgmkslnuctvb.supabase.co";
const SUPABASE_SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDUzMDQ2MiwiZXhwIjoyMDgwMTA2NDYyfQ.pAgMGN6MtKm1A3fsKr1GIt8-qmKYhwFjSt92L_6_7us";

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function auditAnomalies() {
    console.log("🕵️ AUDITING SYSTEM FOR POOJA-LIKE ANOMALIES...");
    console.log("Criteria: Leads > 10 AND (No Plan OR No Payments)");

    // 1. Fetch Users with Leads > 10
    const { data: users, error } = await supabase
        .from('users')
        .select('id, name, email, plan_name, total_leads_received, created_at, team_code')
        .gt('total_leads_received', 10);

    if (error) { console.error("Error:", error); return; }

    console.log(`🔍 Checking ${users.length} users with significant leads...`);

    const anomalies = [];

    for (const user of users) {
        // Check Payments
        const { data: payments } = await supabase
            .from('payment_history')
            .select('amount')
            .eq('user_id', user.id);

        const hasPayment = payments && payments.length > 0;
        const hasPlan = user.plan_name && user.plan_name !== 'none';

        // Check for "Pooja Pattern": High leads, No Payment
        if (!hasPayment && user.total_leads_received > 20) {
            anomalies.push({
                Name: user.name,
                Email: user.email,
                Team: user.team_code,
                Leads: user.total_leads_received,
                Plan: user.plan_name || 'None',
                Status: "HIGH RISK (No Payment Record)"
            });
        }
        // Check for "No Plan but Leads"
        else if (!hasPlan && user.total_leads_received > 20) {
            anomalies.push({
                Name: user.name,
                Email: user.email,
                Team: user.team_code,
                Leads: user.total_leads_received,
                Plan: 'None (Expired?)',
                Status: "Medium Risk (No Active Plan)"
            });
        }
    }

    if (anomalies.length === 0) {
        console.log("✅ SYSTEM CLEAN. No other users found with this pattern.");
    } else {
        console.table(anomalies);
        console.log(`⚠️ FOUND ${anomalies.length} USERS with similar patterns (Check above).`);
    }
}

auditAnomalies();
