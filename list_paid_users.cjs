const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://vewqzsqddgmkslnuctvb.supabase.co';
const ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ1MzA0NjIsImV4cCI6MjA4MDEwNjQ2Mn0.g-e8YNzEy0Z5ul1RGAhBMDj41TtWGuNPEzZz4XEGPg4";

const supabase = createClient(SUPABASE_URL, ANON_KEY);

async function listAllPaidUsers() {
    const { data: users, error } = await supabase
        .from('users')
        .select('name, plan_name')
        .neq('plan_name', 'none')
        .order('name', { ascending: true });

    if (error) return console.log(error.message);

    console.log(`\n📋 ALL PAID USERS LIST (Total: ${users.length})\n`);
    console.log(`| #  | Name                      | Plan          |`);
    console.log(`|----|---------------------------|---------------|`);

    users.forEach((u, i) => {
        console.log(`| ${String(i + 1).padEnd(2)} | ${(u.name || 'Unknown').padEnd(25)} | ${(u.plan_name || '-').padEnd(13)} |`);
    });

    console.log(`\nTotal: ${users.length} Paid Users`);
}

listAllPaidUsers();
