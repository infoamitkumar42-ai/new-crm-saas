
const { createClient } = require('@supabase/supabase-js');
const SUPABASE_URL = 'https://vewqzsqddgmkslnuctvb.supabase.co';
const ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ1MzA0NjIsImV4cCI6MjA4MDEwNjQ2Mn0.g-e8YNzEy0Z5ul1RGAhBMDj41TtWGuNPEzZz4XEGPg4";
const supabase = createClient(SUPABASE_URL, ANON_KEY);

async function checkRajwinderTeamDetail() {
    const { data: members } = await supabase
        .from('users')
        .select('name, email, plan_name, is_active')
        .eq('team_code', 'TEAMRAJ');

    console.log("TEAMRAJ Members:");
    members.forEach(m => {
        console.log(`Name: ${m.name} | Email: ${m.email} | Plan: ${m.plan_name} | Active: ${m.is_active}`);
    });
}

checkRajwinderTeamDetail();
