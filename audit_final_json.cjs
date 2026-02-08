
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://vewqzsqddgmkslnuctvb.supabase.co';
const SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDUzMDQ2MiwiZXhwIjoyMDgwMTA2NDYyfQ.pAgMGN6MtKm1A3fsKr1GIt8-qmKYhwFjSt92L_6_7us";

const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

async function finalAuditJSON() {
    console.log("🕵️‍♂️ FINAL AUDIT: Checking inside Payment JSON Payload...");

    const teams = ['GJ01TEAMFIRE', 'TEAMRAJ', 'TEAMFIRE'];
    const TeamLabels = { 'GJ01TEAMFIRE': 'Chirag', 'TEAMRAJ': 'Rajwinder', 'TEAMFIRE': 'Himanshu' };

    // 1. Fetch ALL captured payments (Optimization: Fetch only needed fields)
    console.log("Fetching payment history...");
    const { data: allPayments } = await supabase.from('payments')
        .select('amount, created_at, raw_payload, user_id')
        .eq('status', 'captured')
        .gte('created_at', '2026-01-01'); // 2026 data only

    console.log(`Fetched ${allPayments.length} payments.`);

    // 2. Iterate Teams
    for (const team of teams) {
        console.log(`\n🏆 TEAM: ${TeamLabels[team]} (${team})`);

        // Get Active Users
        const { data: users } = await supabase.from('users')
            .select('id, name, email, phone, valid_until')
            .eq('team_code', team)
            .eq('is_active', true)
        // .gte('valid_until', new Date().toISOString()) // Only future valid

        // Filter users who are marked active but need verification
        // Also include those whose valid_until > now
        const activeUsers = users.filter(u => u.valid_until && new Date(u.valid_until) > new Date());

        let confirmedPaid = 0;
        let manualOrFree = 0;

        for (const u of activeUsers) {
            // Find Payment
            const pay = allPayments.find(p => {
                // Method A: User ID Match (Most Reliable)
                if (p.user_id === u.id) return true;

                // Method B: Email in Payload
                const payEmail = p.raw_payload?.email || p.raw_payload?.notes?.email;
                if (payEmail && payEmail.toLowerCase() === u.email?.toLowerCase()) return true;

                // Method C: Phone in Payload
                const payPhone = p.raw_payload?.contact; // +91...
                if (payPhone && u.phone && payPhone.includes(u.phone.replace('+91', ''))) return true;

                return false;
            });

            if (pay) {
                confirmedPaid++;
            } else {
                manualOrFree++;
                // console.log(`   ⚠️ No Digital Payment: ${u.name} (${u.email})`);
            }
        }

        console.log(`   ✅ Total Active Users: ${activeUsers.length}`);
        console.log(`   💰 Payment Verified:   ${confirmedPaid}`);
        console.log(`   📝 Manual/Legacy:      ${manualOrFree}`);
    }
}

finalAuditJSON();
