const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const SUPABASE_URL = "https://vewqzsqddgmkslnuctvb.supabase.co";
const SUPABASE_SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDUzMDQ2MiwiZXhwIjoyMDgwMTA2NDYyfQ.pAgMGN6MtKm1A3fsKr1GIt8-qmKYhwFjSt92L_6_7us";

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function auditHimanshuTeam() {
    console.log("🔍 AUDITING HIMANSHU'S TEAM (Active & Paid Users)...");
    console.log("===================================================");

    try {
        // 1. Get Himanshu's exact Team Code first (to be safe)
        const { data: managers } = await supabase
            .from('users')
            .select('team_code')
            .ilike('name', '%Himanshu%')
            .eq('role', 'manager')
            .limit(1);

        const teamCode = managers && managers.length > 0 ? managers[0].team_code : 'TEAMHIMANSHU';
        console.log(`✅ Target Team Code: ${teamCode}`);

        // 2. Fetch Active Users in that Team
        const { data: users, error: userError } = await supabase
            .from('users')
            .select('id, name, email, phone, plan_name, daily_limit, total_leads_received, total_leads_promised, created_at, valid_until')
            .eq('team_code', teamCode)
            .eq('is_active', true)
            .order('name');

        if (userError) throw userError;

        console.log(`👥 Found ${users.length} Active Users.`);

        const report = [];

        for (const user of users) {
            // 3. For each user, fetch payment history
            const { data: payments } = await supabase
                .from('payment_history')
                .select('amount, payment_date, plan_type, status')
                .eq('user_id', user.id)
                .or('status.eq.completed,status.eq.paid,status.eq.success') // Filter successful payments
                .order('payment_date', { ascending: false });

            // Calculate Total Paid
            let totalPaid = 0;
            let lastPaymentDate = 'N/A';
            const paymentDetails = [];

            if (payments && payments.length > 0) {
                totalPaid = payments.reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0);
                lastPaymentDate = new Date(payments[0].payment_date).toLocaleDateString('en-IN');
                payments.forEach(p => {
                    paymentDetails.push(`${p.plan_type} (₹${p.amount}) - ${new Date(p.payment_date).toLocaleDateString('en-IN')}`);
                });
            }

            // Only include if they have paid OR have a plan (manual activation)
            // User asked for "paid members". If totalPaid is 0 but they have a plan, maybe clarify.
            // Let's include everyone active with a plan, noting 0 payment if applicable (manual entry).

            if (user.plan_name === null || user.plan_name === 'none') {
                // Skip if no plan
                continue;
            }

            report.push({
                Name: user.name,
                Email: user.email,
                "Plan Name": user.plan_name,
                "Active Payment (₹)": totalPaid,
                "Last Payment": lastPaymentDate,
                "Valid Until": user.valid_until ? new Date(user.valid_until).toLocaleDateString('en-IN') : 'Lifetime/Manual',
                "Daily Limit": user.daily_limit,
                "Total Leads Rcvd": user.total_leads_received,
                "Promised Leads": user.total_leads_promised,
                "Payment History": paymentDetails.join(" | ")
            });
        }

        // 4. Print Report
        console.table(report);

        // CSV Format Output for easier copy-paste
        console.log("\n📋 CSV FORMAT (Copy below):");
        console.log("Name,Email,Plan,Total Paid,Total Leads Received,Promised,Last Payment");
        report.forEach(r => {
            console.log(`${r.Name},${r.Email},${r['Plan Name']},₹${r['Active Payment (₹)']},${r['Total Leads Rcvd']},${r['Promised Leads']},${r['Last Payment']}`);
        });

    } catch (e) {
        console.error("❌ Error:", e.message);
    }
}

auditHimanshuTeam();
