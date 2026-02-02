const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://vewqzsqddgmkslnuctvb.supabase.co';
const ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ1MzA0NjIsImV4cCI6MjA4MDEwNjQ2Mn0.g-e8YNzEy0Z5ul1RGAhBMDj41TtWGuNPEzZz4XEGPg4";

const supabase = createClient(SUPABASE_URL, ANON_KEY);

async function countMamtaLeads() {
    const email = 'mamtaoad23@gmail.com';

    console.log(`📊 COUNTING LEADS FOR: ${email}\n`);

    // Get user ID
    const { data: user } = await supabase
        .from('users')
        .select('id, name, total_leads_received, total_leads_promised')
        .ilike('email', email)
        .single();

    if (!user) {
        console.log("❌ User not found!");
        return;
    }

    // Count actual leads from leads table
    const { count } = await supabase
        .from('leads')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', user.id);

    console.log(`User: ${user.name}`);
    console.log(`\n📦 LEADS COUNT:`);
    console.log(`  Actual Leads in DB: ${count || 0}`);
    console.log(`  total_leads_received (Profile): ${user.total_leads_received || 0}`);
    console.log(`  total_leads_promised (Plan): ${user.total_leads_promised || 0}`);

    const remaining = (user.total_leads_promised || 0) - (count || 0);
    console.log(`\n📊 REMAINING: ${remaining > 0 ? remaining : 0} leads`);
}

countMamtaLeads();
