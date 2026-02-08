
const { createClient } = require('@supabase/supabase-js');
const SUPABASE_URL = 'https://vewqzsqddgmkslnuctvb.supabase.co';
const ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ1MzA0NjIsImV4cCI6MjA4MDEwNjQ2Mn0.g-e8YNzEy0Z5ul1RGAhBMDj41TtWGuNPEzZz4XEGPg4";
const supabase = createClient(SUPABASE_URL, ANON_KEY);

async function checkSumit() {
    console.log("🕵️ Checking Sumit's data directly...");
    const { data: user, error } = await supabase
        .from('users')
        .select('id, name, email, team_code, leads_today')
        .eq('email', 'sumitbambhaniya024@gmail.com')
        .single();

    if (error || !user) {
        console.error("❌ Sumit not found:", error?.message);
        return;
    }

    console.log(`👤 Name: ${user.name}`);
    console.log(`🛡️ Team Code: ${user.team_code}`);
    console.log(`📊 Leads Today (DB Column): ${user.leads_today}`);

    // Check actual leads table for him today
    const today = new Date().toISOString().split('T')[0];
    const { count } = await supabase
        .from('leads')
        .select('*', { count: 'exact', head: true })
        .eq('assigned_to', user.id)
        .gte('created_at', today + 'T00:00:00Z');

    console.log(`📝 Actual Leads in 'leads' table today: ${count}`);
}

checkSumit();
