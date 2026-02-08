
const { createClient } = require('@supabase/supabase-js');
const SUPABASE_URL = 'https://vewqzsqddgmkslnuctvb.supabase.co';
const ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ1MzA0NjIsImV4cCI6MjA4MDEwNjQ2Mn0.g-e8YNzEy0Z5ul1RGAhBMDj41TtWGuNPEzZz4XEGPg4";
const supabase = createClient(SUPABASE_URL, ANON_KEY);

async function finalSyncVerify() {
    console.log("📊 POST-SYNC TEAM DATA:");

    const teams = ['TEAMFIRE', 'TEAMRAJ', 'GJ01TEAMFIRE'];

    for (const code of teams) {
        const { count, data } = await supabase
            .from('users')
            .select('name, email, is_active, is_online', { count: 'exact' })
            .eq('team_code', code);

        console.log(`\n🔹 Team: ${code} (${count} members)`);
        if (data && data.length > 0) {
            console.log(`   Sample: ${data[0].name} | Active: ${data[0].is_active} | Online: ${data[0].is_online}`);
            const activeOnline = data.filter(u => u.is_active && u.is_online).length;
            console.log(`   Eligible for Leads (Active & Online): ${activeOnline}`);
        }
    }
}

finalSyncVerify();
