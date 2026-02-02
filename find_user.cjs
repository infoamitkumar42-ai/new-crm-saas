const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://vewqzsqddgmkslnuctvb.supabase.co';
const ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ1MzA0NjIsImV4cCI6MjA4MDEwNjQ2Mn0.g-e8YNzEy0Z5ul1RGAhBMDj41TtWGuNPEzZz4XEGPg4";

const supabase = createClient(SUPABASE_URL, ANON_KEY);

async function findUser() {
    const emailSearch = 'ms0286777';

    console.log(`🔍 SEARCHING FOR USER: ${emailSearch}\n`);

    // Search with partial match
    const { data: users, error } = await supabase
        .from('users')
        .select('id, name, email')
        .ilike('email', `%${emailSearch}%`);

    if (error) {
        console.log(`❌ Error: ${error.message}`);
        return;
    }

    if (!users || users.length === 0) {
        console.log("❌ No users found with that email pattern.");

        // Try searching by name containing numbers
        const { data: byName } = await supabase
            .from('users')
            .select('id, name, email')
            .ilike('email', '%0286%');

        if (byName && byName.length > 0) {
            console.log("\nFound similar emails:");
            byName.forEach(u => console.log(`  - ${u.name}: ${u.email}`));
        }
    } else {
        console.log(`Found ${users.length} user(s):`);
        users.forEach(u => {
            console.log(`  Name: ${u.name}`);
            console.log(`  Email: ${u.email}`);
            console.log(`  ID: ${u.id}`);
            console.log('---');
        });
    }
}

findUser();
