const { createClient } = require('@supabase/supabase-js');

// Config
const SUPABASE_URL = 'https://vewqzsqddgmkslnuctvb.supabase.co';
const ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ1MzA0NjIsImV4cCI6MjA4MDEwNjQ2Mn0.g-e8YNzEy0Z5ul1RGAhBMDj41TtWGuNPEzZz4XEGPg4";

const supabase = createClient(SUPABASE_URL, ANON_KEY);

async function checkPradeepLeads() {
    console.log("🔍 Checking leads for pradeepleads@gmail.com...");

    // 1. Get User ID
    const { data: users, error: userError } = await supabase
        .from('users')
        .select('id, name, leads_today, daily_limit')
        .eq('email', 'pradeepleads@gmail.com')
        .single();

    if (userError || !users) {
        console.error("❌ User not found:", userError?.message);
        return;
    }

    console.log(`👤 User: ${users.name}`);
    console.log(`📊 Dashboard Counter: ${users.leads_today} / ${users.daily_limit}`);

    // 2. Count Real Leads for Today
    const now = new Date();
    // UTC Midnight (Since Supabase stores in UTC usually, but let's check local day window)
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
    const tomorrowStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1).toISOString();

    const { count, error: leadError } = await supabase
        .from('leads')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', users.id)
        .gte('created_at', todayStart)
        .lt('created_at', tomorrowStart);

    if (leadError) {
        console.error("❌ Error counting leads:", leadError.message);
        return;
    }

    console.log(`✅ Real Leads Assigned Today (UTC Day): ${count}`);
}

checkPradeepLeads();
