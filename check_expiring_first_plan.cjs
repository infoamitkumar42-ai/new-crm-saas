const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://vewqzsqddgmkslnuctvb.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDUzMDQ2MiwiZXhwIjoyMDgwMTA2NDYyfQ.pAgMGN6MtKm1A3fsKr1GIt8-qmKYhwFjSt92L_6_7us';
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function checkExpiringFirstPayment() {
    console.log('🔍 CHECKING FOR USERS COMPLETING 1ST PLAN (Ending Today/Recently)...');

    // 1. Get Active Users
    const { data: users, error } = await supabase
        .from('users')
        .select(`
            id, name, email, plan_type, start_date, created_at, daily_limit, leads_today,
            payments (
                id, amount, status, created_at, plan_name
            )
        `)
        .eq('is_active', true);

    if (error) { console.error(error); return; }

    // Constants for Plan Leads
    // Identify 1st time users: Only 1 successful payment ever

    console.log('\n--- Possible Expiring First-Time Users ---');
    console.log('%-20s | %-10s | %-10s | %-8s | %s', 'Name', 'Plan', 'TotalLeads', 'Delivered', 'Status');
    console.log('-----------------------------------------------------------------------');

    let expiringFound = 0;

    for (const u of users) {
        // Filter only success payments
        const successPayments = u.payments?.filter(p => p.status === 'captured' || p.status === 'success') || [];

        // "1st Payment Wala" -> Exactly 1 payment
        if (successPayments.length !== 1) continue;

        const payment = successPayments[0];
        let totalLeadsFromPlan = 0;
        let planDurationDays = 15; // default

        // Determine Plan Details (heuristic based on amount or name)
        if (payment.amount >= 990 && payment.amount <= 1000) { // 999
            totalLeadsFromPlan = 50;
            planDurationDays = 10;
        } else if (payment.amount >= 1990 && payment.amount <= 2000) { // 1999
            totalLeadsFromPlan = 105;
            planDurationDays = 15;
        } else if (payment.amount >= 2990 && payment.amount <= 3000) { // 2999
            totalLeadsFromPlan = 160;
            planDurationDays = 20;
        } else {
            // Heuristic: Start Plan
            totalLeadsFromPlan = 50;
        }

        // Calculate Leads Delivered Total
        // Since we don't have a 'lifetime_leads' counter easily, we query leads table
        const { count: deliveredCount } = await supabase
            .from('leads')
            .select('*', { count: 'exact', head: true })
            .eq('assigned_to', u.id);

        const remaining = totalLeadsFromPlan - (deliveredCount || 0);

        // Logic: If nearly done (less than daily limit left) or overdue
        if (remaining <= (u.daily_limit || 5) * 2) { // 2 days buffer or less
            console.log(`%-20s | %-10s | %-10d | %-8d | ⚠️ Ends Soon/Done (${remaining} left)`,
                u.name.substring(0, 20),
                payment.plan_name || 'Starter',
                totalLeadsFromPlan,
                deliveredCount
            );
            expiringFound++;
        }
    }

    if (expiringFound === 0) {
        console.log("✅ No first-time users found who are expiring today/soon.");
    }
}

checkExpiringFirstPayment();
