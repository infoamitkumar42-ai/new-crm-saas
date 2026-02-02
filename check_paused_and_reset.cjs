const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://vewqzsqddgmkslnuctvb.supabase.co';
const SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDUzMDQ2MiwiZXhwIjoyMDgwMTA2NDYyfQ.pAgMGN6MtKm1A3fsKr1GIt8-qmKYhwFjSt92L_6_7us";

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false }
});

async function runTasks() {
    console.log("==========================================");
    console.log("TASK 1: CHECKING PAUSED USERS");
    console.log("==========================================");

    // Definition: Users who have an Active Payment status but have set is_active to FALSE
    const { data: pausedUsers, error: pausedError } = await supabase
        .from('users')
        .select('name, email, plan_name, is_active, payment_status')
        .eq('is_active', false)
        .eq('payment_status', 'active')
        .neq('plan_name', 'none');

    if (pausedError) {
        console.error("Error fetching paused users:", pausedError.message);
    } else {
        console.log(`Found ${pausedUsers ? pausedUsers.length : 0} Paid Users who are MANUALLY PAUSED (Active Payment, But Inactive):\n`);
        if (pausedUsers && pausedUsers.length > 0) {
            pausedUsers.forEach(u => {
                console.log(`- ${u.name} (${u.email}) | Plan: ${u.plan_name}`);
            });
        } else {
            console.log("No manually paused users found.");
        }
    }

    console.log("\n==========================================");
    console.log("TASK 2: INVESTIGATING & RESETTING ROHIT");
    console.log("==========================================");

    const targetEmail = 'rohitgagneja69@gmail.com';
    const newPassword = 'Rohit123@';

    // Check Public Profile first
    const { data: userProfile, error: profileError } = await supabase
        .from('users')
        .select('*')
        .eq('email', targetEmail)
        .maybeSingle();

    let userId = null;

    if (userProfile) {
        console.log(`✅ Found User Profile for Rohit in 'users' table:`);
        console.log(`   - Name: ${userProfile.name}`);
        console.log(`   - Created At: ${userProfile.created_at}`);
        console.log(`   - Status:Active=${userProfile.is_active}, Online=${userProfile.is_online}`);
        console.log(`   - Plan: ${userProfile.plan_name}`);
        userId = userProfile.id;
    } else {
        console.log(`⚠️ User NOT found in public 'users' table. Checking Auth system...`);
    }

    // Even if found in profile, let's verify Auth ID matches or find if missing
    if (!userId) {
        // Find in Auth by listing (filtered)
        // Since we don't have direct email search in listUsers easily without getting all, we retrieve page 1 (default 50) and hope or filter manually if list is small. 
        // Actually, listUsers doesn't support email filter directly in JS client easily.
        // But we can limit.
        const { data: { users }, error: authListError } = await supabase.auth.admin.listUsers({ perPage: 1000 });

        if (authListError) {
            console.error("Auth Error:", authListError);
        } else {
            const authUser = users.find(u => u.email && u.email.toLowerCase() === targetEmail.toLowerCase());

            if (authUser) {
                console.log(`✅ Found in Supabase Auth System!`);
                console.log(`   - Created At: ${authUser.created_at}`);
                console.log(`   - Last Sign In: ${authUser.last_sign_in_at}`);
                console.log(`   - Email Confirmed: ${authUser.email_confirmed_at ? 'Yes' : 'No'}`);
                userId = authUser.id;
            } else {
                console.log(`❌ User ${targetEmail} does NOT exist in the Authentication system.`);
            }
        }
    }

    if (userId) {
        console.log(`\n🔄 Resetting Password to '${newPassword}'...`);
        const { error: updateError } = await supabase.auth.admin.updateUserById(userId, {
            password: newPassword
        });

        if (updateError) {
            console.log(`❌ Failed to reset password: ${updateError.message}`);
        } else {
            console.log(`✅ Password Reset Successful for ${targetEmail}!`);
        }
    }
}

runTasks();
