
const { createClient } = require('@supabase/supabase-js');
const SUPABASE_URL = 'https://vewqzsqddgmkslnuctvb.supabase.co';
const ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ1MzA0NjIsImV4cCI6MjA4MDEwNjQ2Mn0.g-e8YNzEy0Z5ul1RGAhBMDj41TtWGuNPEzZz4XEGPg4";
const supabase = createClient(SUPABASE_URL, ANON_KEY);

async function forceResetChiragTeam() {
    console.log("🛠️ Force resetting GJ01TEAMFIRE leads_today to 0...");
    const { data, error } = await supabase
        .from('users')
        .update({ leads_today: 0 })
        .eq('team_code', 'GJ01TEAMFIRE')
        .select();

    if (error) {
        console.error("❌ Reset Failed:", error.message);
    } else {
        console.log(`✅ Success! Reset ${data.length} users in Chirag's team.`);
        const sumit = data.find(u => u.email === 'sumitbambhaniya024@gmail.com');
        if (sumit) {
            console.log(`📊 Sumit's new count: ${sumit.leads_today}`);
        }
    }
}

forceResetChiragTeam();
