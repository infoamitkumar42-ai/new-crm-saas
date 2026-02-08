
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://vewqzsqddgmkslnuctvb.supabase.co';
const SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDUzMDQ2MiwiZXhwIjoyMDgwMTA2NDYyfQ.pAgMGN6MtKm1A3fsKr1GIt8-qmKYhwFjSt92L_6_7us";

const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

async function deepAuditPayments() {
    console.log("🕵️‍♂️ DEEP PAYMENT AUDIT (Checking Multiple Payments & Phones)...");

    // 1. Get Suspicious Users (Active but potentially expired)
    const { data: users } = await supabase.from('users')
        .select('id, name, email, phone, plan_name')
        .eq('team_code', 'TEAMFIRE')
        .gte('valid_until', '2026-03-05'); // The suspect batch

    console.log(`Checking ${users.length} users deeply...`);

    let verifiedUsers = 0;
    let genuineFreeloaders = 0;
    const freeloaders = [];

    for (const u of users) {
        // Build Search Query for Payments
        // Match ID OR Email OR Phone
        let query = supabase.from('payments')
            .select('amount, created_at, status, user_email, user_phone')
            .eq('status', 'captured');

        // Construct OR filter
        const conditions = [`user_id.eq.${u.id}`];
        if (u.email) conditions.push(`user_email.eq.${u.email}`);
        if (u.phone) {
            conditions.push(`user_phone.eq.${u.phone}`);
            // Try without +91 too if applicable
            if (u.phone.startsWith('+91')) conditions.push(`user_phone.eq.${u.phone.replace('+91', '')}`);
        }

        // This OR syntax in Supabase JS can be tricky for complex combinations, 
        // let's fetch all potential matches and filter in JS to be safe and accurate.
        // Actually, let's just fetch ALL payments for the last 45 days and filter in memory. 
        // Better for performance than N HTTP calls? No, N calls is better for targeted search.

        const { data: allPayments } = await supabase.from('payments')
            .select('amount, created_at, user_email, user_phone')
            .eq('status', 'captured')
            .gte('created_at', '2026-01-01'); // Check payments from Jan 1st

        // Filter for this user
        const userPayments = allPayments.filter(p => {
            return (p.user_email && p.user_email.toLowerCase() === u.email?.toLowerCase()) ||
                (p.user_phone && u.phone && (p.user_phone === u.phone || p.user_phone === u.phone.replace('+91', '')));
        });

        if (userPayments.length > 0) {
            // Found Payments!
            // Calculate Total days logic roughly:
            // Find LATEST payment date
            // Or calculate coverage?
            // Let's look at the LATEST Significant Payment

            const sorted = userPayments.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
            const latest = sorted[0];
            const latestDate = new Date(latest.created_at);

            // Validity Logic
            let days = 7;
            if (latest.amount >= 999) days = 10;
            if (latest.amount >= 2499) days = 30;

            latestDate.setDate(latestDate.getDate() + days);

            if (latestDate > new Date()) {
                verifiedUsers++;
                // console.log(`✅ ${u.name} is SAFE. Paid on ${new Date(latest.created_at).toLocaleDateString()}`);
            } else {
                // Paid, but Expired
                freeloaders.push({
                    Name: u.name,
                    Status: 'EXPIRED',
                    LastPayment: new Date(latest.created_at).toLocaleDateString(),
                    Amount: latest.amount,
                    ActiveUntilShouldBe: latestDate.toLocaleDateString()
                });
                genuineFreeloaders++;
            }
        } else {
            // NO PAYMENTS FOUND AT ALL
            freeloaders.push({
                Name: u.name,
                Email: u.email,
                Phone: u.phone,
                Status: 'NO_RECORD',
                LastPayment: 'NONE',
                Amount: 0
            });
            genuineFreeloaders++;
        }
    }

    console.log(`\n📊 RESULTS:`);
    console.log(`✅ VERIFIED PAID & VALID: ${verifiedUsers}`);
    console.log(`❌ EXPIRED or NO RECORD:  ${genuineFreeloaders}`);

    if (freeloaders.length > 0) {
        console.log("\n🛑 ACTION REQUIRED FOR THESE USERS:");
        console.table(freeloaders.slice(0, 20)); // Show top 20
    }
}

deepAuditPayments();
