
const { createClient } = require('@supabase/supabase-js');
const SUPABASE_URL = 'https://vewqzsqddgmkslnuctvb.supabase.co';
const ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ1MzA0NjIsImV4cCI6MjA4MDEwNjQ2Mn0.g-e8YNzEy0Z5ul1RGAhBMDj41TtWGuNPEzZz4XEGPg4";
const supabase = createClient(SUPABASE_URL, ANON_KEY);

async function testHimanshuIsolation() {
    console.log("🕵️ Verifying TEAMFIRE Isolation...");

    // 1. Check if manager exists
    const { data: manager } = await supabase.from('users').select('*').eq('team_code', 'TEAMFIRE').eq('role', 'manager').single();
    console.log(`Manager: ${manager?.name} (${manager?.id})`);

    // 2. Check for eligible users
    const { data: teamUsers } = await supabase.from('users')
        .select('*')
        .eq('team_code', 'TEAMFIRE')
        .eq('is_active', true)
        .eq('is_online', true);

    console.log(`Eligible Users in TEAMFIRE: ${teamUsers?.length || 0}`);
    if (teamUsers) {
        teamUsers.forEach(u => console.log(` - ${u.name} (Leads: ${u.leads_today})`));
    }
}

testHimanshuIsolation();
