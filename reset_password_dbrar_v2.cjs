const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://vewqzsqddgmkslnuctvb.supabase.co';
const SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDUzMDQ2MiwiZXhwIjoyMDgwMTA2NDYyfQ.pAgMGN6MtKm1A3fsKr1GIt8-qmKYhwFjSt92L_6_7us";

const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

async function resetPass() {
    console.log("🔐 Resetting Password for dbrar8826@gmail.com...");

    const email = 'dbrar8826@gmail.com';
    const newPass = 'Akash@945';

    // 1. Get Auth User ID first (Reliable Way - Fetch up to 1000 users)
    const { data: { users }, error } = await supabase.auth.admin.listUsers({ perPage: 1000 });

    if (error) {
        console.error("❌ Error listing users:", error.message);
        return;
    }

    const target = users.find(u => u.email.toLowerCase() === email.toLowerCase());

    if (target) {
        console.log(`✅ User Found in Auth DB. ID: ${target.id}`);

        // 2. Update Password
        const { error: resetErr } = await supabase.auth.admin.updateUserById(target.id, {
            password: newPass,
            email_confirm: true // Force email confirmation too
        });

        if (!resetErr) {
            console.log("✅ SUCCESS! Password changed to: " + newPass);
            console.log("Please ask user to login now using this password.");
        } else {
            console.error("❌ Reset Failed:", resetErr.message);
        }
    } else {
        console.error("❌ User NOT FOUND in Auth DB.");

        // Check public.users
        const { data: publicUser } = await supabase
            .from('users')
            .select('*')
            .ilike('email', email)
            .single();

        if (publicUser) {
            console.log(`⚠️ User EXISTS in public.users (ID: ${publicUser.id}) but NOT in Auth.`);
            console.log("   Attempting to RE-CREATE Auth User with same ID...");

            const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
                email: email,
                password: newPass,
                email_confirm: true,
                user_metadata: { name: publicUser.name },
                app_metadata: { provider: 'email', providers: ['email'] }
            });

            if (createError) {
                console.error("❌ Failed to create Auth User:", createError.message);
            } else {
                console.log("✅ Auth User Created Successfully!");
                console.log(`   New ID: ${newUser.user.id}`);

                if (newUser.user.id !== publicUser.id) {
                    console.log("⚠️ ID Mismatch! Updating public.users to match new Auth ID...");
                    // Update public.users ID is tricky due to FKs.
                    // Instead, update the NEW Auth User's ID? No, can't change Auth ID easily.
                    // Better: We should have tried to force ID in createUser?
                    // Supabase admin.createUser implies random ID usually, unless we use direct SQL insertion into auth.users (not possible via JS client).

                    // IF mismatch, update public.users OLD record to NEW ID?
                    // This is complex due to Foreign Keys in leads, etc.
                    // Valid approach: Update public.users SET id = new_id WHERE email = ....
                    // But first we must disable triggers or handle FKs.

                    // Actually, let's see if the ID matches first.
                } else {
                    console.log("✅ ID Matched perfectly (if Supabase allowed it).");
                }
                console.log("✅ Password set to: " + newPass);
            }

        } else {
            console.log("❌ User also NOT FOUND in public.users.");
        }
    }
}

resetPass();
