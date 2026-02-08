
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://vewqzsqddgmkslnuctvb.supabase.co';
const SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDUzMDQ2MiwiZXhwIjoyMDgwMTA2NDYyfQ.pAgMGN6MtKm1A3fsKr1GIt8-qmKYhwFjSt92L_6_7us";

const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

async function deepAuditPaymentsSafe() {
    console.log("🕵️‍♂️ DEEP PAYMENT AUDIT (Safe Mode)...");

    // 1. Get Suspicious Users
    const { data: users } = await supabase.from('users')
        .select('id, name, email, phone')
        .eq('team_code', 'TEAMFIRE')
        .gte('valid_until', '2026-03-05');

    if (!users) return console.log("No users found.");

    console.log(`Checking ${users.length} users one by one...`);

    let verified = 0;
    let expired = 0;
    let noRecord = 0;
    const report = [];

    for (const u of users) {
        // Query Payments for THIS user
        // Using OR filter in Supabase: user_id OR user_email OR user_phone
        let filters = `user_id.eq.${u.id}`;
        if (u.email) filters += `,user_email.eq.${u.email}`;
        if (u.phone) {
            filters += `,user_phone.eq.${u.phone}`;
            if (u.phone.startsWith('+91')) {
                filters += `,user_phone.eq.${u.phone.replace('+91', '')}`;
            }
        }

        const { data: payments } = await supabase.from('payments')
            .select('amount, created_at, status')
            .or(filters)
            .eq('status', 'captured')
            .order('created_at', { ascending: false });

        if (payments && payments.length > 0) {
            // Found Payments!
            const lastPay = payments[0];
            const payDate = new Date(lastPay.created_at);

            // Calculate Validity
            let days = 7;
            if (lastPay.amount >= 999) days = 10; // Starter
            if (lastPay.amount >= 1999) days = 30; // Manager/Turbo

            const expiry = new Date(payDate);
            expiry.setDate(expiry.getDate() + days);

            if (expiry > new Date()) {
                verified++;
            } else {
                expired++;
                report.push({
                    Name: u.name,
                    Email: u.email,
                    Status: 'EXPIRED',
                    LastPayDate: payDate.toLocaleDateString(),
                    Amount: lastPay.amount,
                    ShouldExpire: expiry.toLocaleDateString()
                });
            }
        } else {
            noRecord++;
            report.push({
                Name: u.name,
                Email: u.email,
                Status: 'NO_PAYMENT_FOUND',
                LastPayDate: 'NONE',
                Amount: 0,
                ShouldExpire: 'NOW'
            });
        }
    }

    console.log(`\n📊 FINAL RESULTS:`);
    console.log(`✅ VERIFIED ACTIVE: ${verified}`);
    console.log(`⚠️ EXPIRED (But Active): ${expired}`);
    console.log(`❌ NO RECORD (But Active): ${noRecord}`);
    console.log(`🛑 TOTAL TO DISABLE: ${expired + noRecord}`);

    if (report.length > 0) {
        console.log("\nSample Deactivation List:");
        console.table(report.slice(0, 15));
    }
}

deepAuditPaymentsSafe();
