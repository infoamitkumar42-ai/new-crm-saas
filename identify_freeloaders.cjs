
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://vewqzsqddgmkslnuctvb.supabase.co';
const SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDUzMDQ2MiwiZXhwIjoyMDgwMTA2NDYyfQ.pAgMGN6MtKm1A3fsKr1GIt8-qmKYhwFjSt92L_6_7us";

const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

async function identifyFreeloaders() {
    console.log("🕵️‍♂️ IDENTIFYING WRONGLY ACTIVE USERS...");

    // 1. Get Users with the suspicious 2026-03-06 date
    const { data: users } = await supabase.from('users')
        .select('id, name, email, plan_name, valid_until')
        .eq('team_code', 'TEAMFIRE')
        .gte('valid_until', '2026-03-05') // Approx that date
        .lte('valid_until', '2026-03-07');

    console.log(`Analyzing ${users.length} users with extended validity...`);

    let freeloaders = [];

    for (const u of users) {
        // Get Last Payment
        const { data: pay } = await supabase.from('payments')
            .select('amount, created_at, plan_name')
            .or(`user_email.eq.${u.email},user_id.eq.${u.id}`)
            .eq('status', 'captured')
            .order('created_at', { ascending: false })
            .limit(1);

        if (pay && pay.length > 0) {
            const lastPayDate = new Date(pay[0].created_at);
            const amount = pay[0].amount;

            // Determine Real Validity based on Amount
            let days = 0;
            if (amount >= 2999) days = 30; // Manager
            else if (amount >= 2499) days = 30; // Turbo
            else if (amount >= 1499) days = 15; // Weekly? No, standard is 10/30
            else if (amount >= 999) days = 10; // Starter
            else days = 7; // Trial?

            // Calculated Expiry
            const realExpiry = new Date(lastPayDate);
            realExpiry.setDate(realExpiry.getDate() + days); // Add days

            const today = new Date();

            if (realExpiry < today) {
                // EXPIRED! But System says Active till March
                freeloaders.push({
                    Name: u.name,
                    Email: u.email,
                    Plan: u.plan_name,
                    Paid_Date: lastPayDate.toLocaleDateString(),
                    Amount: amount,
                    Should_Expire: realExpiry.toLocaleDateString(),
                    System_Expiry: new Date(u.valid_until).toLocaleDateString()
                });
            }
        } else {
            // No Payment Found? Definitely Freeloader (unless Manual)
            freeloaders.push({
                Name: u.name,
                Email: u.email,
                Plan: u.plan_name,
                Paid_Date: 'NEVER/MANUAL',
                Amount: 0,
                Should_Expire: 'IMMEDIATELY',
                System_Expiry: new Date(u.valid_until).toLocaleDateString()
            });
        }
    }

    console.log(`\n🚨 FOUND ${freeloaders.length} USERS WHO SHOULD BE EXPIRED!`);
    if (freeloaders.length > 0) {
        console.table(freeloaders.slice(0, 15)); // Show sample
        console.log(`... and ${freeloaders.length - 15} more.`);
    }
}

identifyFreeloaders();
