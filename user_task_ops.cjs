
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://vewqzsqddgmkslnuctvb.supabase.co';
const SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDUzMDQ2MiwiZXhwIjoyMDgwMTA2NDYyfQ.pAgMGN6MtKm1A3fsKr1GIt8-qmKYhwFjSt92L_6_7us";

const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

async function performTasks() {
    console.log("🕵️‍♂️ TASK 1: Checking Sakshi Status...");

    // 1. Get User Details
    const { data: u1 } = await supabase.from('users')
        .select('*')
        .eq('email', 'sakshidigra24@gmail.com')
        .single();

    if (u1) {
        console.log("✅ USER FOUND:");
        console.log(`- Name: ${u1.name}`);
        console.log(`- Active: ${u1.is_active}`);
        console.log(`- Plan: ${u1.plan_name}`);
        console.log(`- Valid Until: ${u1.valid_until}`);
        console.log(`- Leads Today: ${u1.leads_today}`);

        // Check Last Payment just in case
        const { data: pay } = await supabase.from('payments')
            .select('amount, created_at, status')
            .eq('user_email', u1.email)
            .eq('status', 'captured')
            .order('created_at', { ascending: false })
            .limit(1);

        if (pay && pay.length > 0) {
            console.log(`💰 Last Payment: ₹${pay[0].amount} on ${new Date(pay[0].created_at).toLocaleDateString()}`);
        } else {
            console.log("⚠️ NO Successful Payment Record Found.");
        }
    } else {
        console.log("❌ User 'sakshidigra24@gmail.com' NOT FOUND.");
    }

    // ----------------------------------------------------

    console.log("\n🔐 TASK 2: Resetting Password for Dbrar8826@gmail.com...");

    // 2. Reset Password
    const NEW_PASS = "Akash123@#";
    const { data: u2, error: err2 } = await supabase.auth.admin.updateUserById(
        // Wait, we need User ID first
        (await supabase.from('users').select('id').eq('email', 'Dbrar8826@gmail.com').single()).data?.id,
        { password: NEW_PASS }
    );

    if (err2) {
        // Retry by searching user in Auth table directly if public.users mapping is weird
        console.log("⚠️ Could not update by ID. Trying by Email directly...");
        // Actually, supabase.auth.admin.updateUserById needs UUID. 
        // Let's get UUID from searchUserByEmail
        const { data: authUser } = await supabase.auth.admin.listUsers();
        const target = authUser.users.find(u => u.email.toLowerCase() === 'dbrar8826@gmail.com');

        if (target) {
            const { error: resetErr } = await supabase.auth.admin.updateUserById(target.id, { password: NEW_PASS });
            if (!resetErr) console.log("✅ Password Updated Successfully!");
            else console.error("❌ Reset Failed:", resetErr.message);
        } else {
            console.error("❌ User 'Dbrar8826@gmail.com' not found in Auth System.");
        }
    } else if (u2) {
        console.log("✅ Password Updated Successfully via ID!");
    }
}

performTasks();
