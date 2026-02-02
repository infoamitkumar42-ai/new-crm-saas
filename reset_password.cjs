const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://vewqzsqddgmkslnuctvb.supabase.co';
const SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDUzMDQ2MiwiZXhwIjoyMDgwMTA2NDYyfQ.Cm5TxsXMoXUooD3J8t5-e4VEVwFPeIYqSHOPH4QH228";

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false }
});

async function findAndResetPassword() {
    const emailSearch = 'ms0286777';
    const newPassword = 'Rahul123@#';

    console.log(`🔍 SEARCHING FOR USER WITH EMAIL CONTAINING: ${emailSearch}\n`);

    // Search with partial match
    const { data: users, error } = await supabase
        .from('users')
        .select('id, name, email')
        .ilike('email', `%${emailSearch}%`);

    if (error) {
        console.log(`❌ Search error: ${error.message}`);
        return;
    }

    if (!users || users.length === 0) {
        console.log("❌ No users found matching that email pattern.");
        console.log("\nSearching in auth.users...");

        // Try listing auth users
        const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();

        if (authError) {
            console.log(`Auth error: ${authError.message}`);
            return;
        }

        const matchingUser = authUsers.users.find(u =>
            u.email && u.email.toLowerCase().includes(emailSearch.toLowerCase())
        );

        if (matchingUser) {
            console.log(`\nFound in auth: ${matchingUser.email} (ID: ${matchingUser.id})`);

            const { error: resetError } = await supabase.auth.admin.updateUserById(matchingUser.id, {
                password: newPassword
            });

            if (resetError) {
                console.log(`❌ Reset error: ${resetError.message}`);
            } else {
                console.log(`\n✅ PASSWORD RESET SUCCESSFUL!`);
                console.log(`Email: ${matchingUser.email}`);
                console.log(`New Password: ${newPassword}`);
            }
        } else {
            console.log("❌ User not found in auth.users either.");
        }
        return;
    }

    console.log(`Found ${users.length} matching user(s):`);
    users.forEach(u => console.log(`  - ${u.name} (${u.email})`));

    // Reset first match
    const user = users[0];
    console.log(`\nResetting password for: ${user.name} (${user.email})`);

    const { error: resetError } = await supabase.auth.admin.updateUserById(user.id, {
        password: newPassword
    });

    if (resetError) {
        console.log(`❌ Reset error: ${resetError.message}`);
    } else {
        console.log(`\n✅ PASSWORD RESET SUCCESSFUL!`);
        console.log(`Email: ${user.email}`);
        console.log(`New Password: ${newPassword}`);
    }
}

findAndResetPassword();
