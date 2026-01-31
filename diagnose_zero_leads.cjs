const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://vewqzsqddgmkslnuctvb.supabase.co';
const ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ1MzA0NjIsImV4cCI6MjA4MDEwNjQ2Mn0.g-e8YNzEy0Z5ul1RGAhBMDj41TtWGuNPEzZz4XEGPg4";
const supabase = createClient(SUPABASE_URL, ANON_KEY);

async function diagnoseZeroLeads() {
    const targetNames = ['Lakhveer kaur', 'Harwinder kaur', 'Gaganpreet'];
    console.log(`🔍 Diagnosing why these users have 0 leads: ${targetNames.join(', ')}...`);

    const { data: users, error } = await supabase
        .from('users')
        .select(`
            id, name, email, 
            is_active, is_online, 
            plan_name, 
            daily_limit, leads_today,
            valid_until
        `)
        .in('name', targetNames);

    if (error) return console.error(error);

    users.forEach(u => {
        console.log(`\n👤 User: ${u.name}`);
        console.log(`   - Status: ${u.is_active ? '✅ Active Plan' : '❌ Inactive Plan'}`);
        console.log(`   - Online: ${u.is_online ? '🟢 Online' : '🔴 Offline (Main Reason?)'}`);
        console.log(`   - Daily Limit: ${u.daily_limit}`);
        console.log(`   - Leads Today: ${u.leads_today}`);
        console.log(`   - Valid Until: ${u.valid_until ? new Date(u.valid_until).toLocaleDateString() : 'N/A'}`);

        if (!u.is_online) console.log("   👉 ISSUE: User is marked OFFLINE.");
        if (u.daily_limit === 0) console.log("   👉 ISSUE: Daily Limit is 0.");
    });
}

diagnoseZeroLeads();
