const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = "https://vewqzsqddgmkslnuctvb.supabase.co";
const SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDUzMDQ2MiwiZXhwIjoyMDgwMTA2NDYyfQ.pAgMGN6MtKm1A3fsKr1GIt8-qmKYhwFjSt92L_6_7us";
const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

async function main() {
    console.log("🔍 Finding INACTIVE users with Feb payments specifically in TEAMFIRE...\n");

    const febStart = '2026-02-01T00:00:00.000Z';

    // 1. Fetch TEAMFIRE users who are currently INACTIVE
    const { data: teamUsers, error: uErr } = await supabase
        .from('users')
        .select('id, name, email, plan_name, is_active, created_at')
        .eq('team_code', 'TEAMFIRE')
        .eq('is_active', false);

    if (uErr) {
        console.error("Error fetching users:", uErr.message);
        return;
    }

    if (!teamUsers || teamUsers.length === 0) {
        console.log("✅ There are 0 inactive users in TEAMFIRE.");
        return;
    }

    const inactiveTeamUserIds = teamUsers.map(u => u.id);

    // 2. Fetch recent payments for JUST these inactive TEAMFIRE users
    const { data: recentPayments, error: pErr } = await supabase
        .from('payments')
        .select('id, user_id, amount, created_at, status')
        .eq('status', 'captured')
        .gte('created_at', febStart)
        .in('user_id', inactiveTeamUserIds);

    if (pErr) {
        console.error("Error fetching payments:", pErr.message);
        return;
    }

    // Get unique user IDs from those payments
    const paidUserIds = Array.from(new Set(recentPayments.map(p => p.user_id)));

    const affectedUsers = teamUsers.filter(u => paidUserIds.includes(u.id));

    if (affectedUsers.length === 0) {
        console.log("✅ Good news! There are 0 users in TEAMFIRE who are inactive despite paying in February.");
    } else {
        console.log(`⚠️ Found ${affectedUsers.length} users in TEAMFIRE marked INACTIVE who made a payment in February 2026:`);

        affectedUsers.forEach(u => {
            // Find their payments to display
            const userPayments = recentPayments.filter(p => p.user_id === u.id);
            const latestPayment = userPayments.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))[0];

            // Calculate days since payment
            const daysSince = Math.floor((new Date() - new Date(latestPayment.created_at)) / (1000 * 60 * 60 * 24));

            console.log(`\n- Name: ${u.name}`);
            console.log(`  Email: ${u.email}`);
            console.log(`  Plan: ${u.plan_name}`);
            console.log(`  Latest Payment: ₹${latestPayment.amount} on ${latestPayment.created_at.split('T')[0]} (${daysSince} days ago)`);
        });
    }
}

main().catch(console.error);
