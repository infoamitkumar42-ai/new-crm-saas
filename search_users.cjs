const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://vewqzsqddgmkslnuctvb.supabase.co';
const ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ1MzA0NjIsImV4cCI6MjA4MDEwNjQ2Mn0.g-e8YNzEy0Z5ul1RGAhBMDj41TtWGuNPEzZz4XEGPg4";

const supabase = createClient(SUPABASE_URL, ANON_KEY);

async function searchUsers(searchTerm) {
    console.log(`🔍 Searching for: ${searchTerm}\n`);

    const { data: users, error } = await supabase
        .from('users')
        .select('name, email, team_code')
        .or(`email.ilike.%${searchTerm}%,name.ilike.%${searchTerm}%`)
        .limit(10);

    if (error) {
        console.log('❌ Error:', error.message);
        return;
    }

    if (!users || users.length === 0) {
        console.log('❌ No users found');
        return;
    }

    console.log(`Found ${users.length} user(s):\n`);
    users.forEach((u, i) => {
        console.log(`${i + 1}. ${u.name} - ${u.email} (${u.team_code})`);
    });
}

const term = process.argv[2];
if (!term) {
    console.log('Usage: node search_users.cjs tanu');
    process.exit(1);
}

searchUsers(term);
