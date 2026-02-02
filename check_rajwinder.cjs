const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://vewqzsqddgmkslnuctvb.supabase.co';
const ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ1MzA0NjIsImV4cCI6MjA4MDEwNjQ2Mn0.g-e8YNzEy0Z5ul1RGAhBMDj41TtWGuNPEzZz4XEGPg4";
const supabase = createClient(SUPABASE_URL, ANON_KEY);

async function checkRajwinder() {
    console.log("🕵️ CHECKING RAJWINDER STATUS...\n");
    const email = 'workwithrajwinder@gmail.com';
    const { data: user, error } = await supabase.from('users').select('*').eq('email', email).single();

    if (error) return console.error(error);
    if (!user) return console.error("Rajwinder Not Found");

    console.log(user);
    console.log(`\nID: ${user.id}`);
    console.log(`Limit: ${user.daily_limit}`);
    console.log(`Leads Today: ${user.leads_today}`);
}

checkRajwinder();
