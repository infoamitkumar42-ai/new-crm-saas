
const { createClient } = require('@supabase/supabase-js');
const SUPABASE_URL = 'https://vewqzsqddgmkslnuctvb.supabase.co';
const ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ1MzA0NjIsImV4cCI6MjA4MDEwNjQ2Mn0.g-e8YNzEy0Z5ul1RGAhBMDj41TtWGuNPEzZz4XEGPg4";
const supabase = createClient(SUPABASE_URL, ANON_KEY);

async function searchSumitRaw() {
    const { data: users } = await supabase
        .from('users')
        .select('id, name, email, team_code, leads_today');

    const filtered = users.filter(u =>
        (u.name && u.name.toLowerCase().includes('sumit')) ||
        (u.email && u.email.toLowerCase().includes('sumit'))
    );

    console.log("Found Users:");
    filtered.forEach(u => {
        console.log(`ID: ${u.id} | Name: ${u.name} | Email: ${u.email} | Team: ${u.team_code} | Leads: ${u.leads_today}`);
    });
}

searchSumitRaw();
