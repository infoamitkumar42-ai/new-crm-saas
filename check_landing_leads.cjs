const { createClient } = require('@supabase/supabase-js');

// Config
const SUPABASE_URL = 'https://vewqzsqddgmkslnuctvb.supabase.co';
const ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ1MzA0NjIsImV4cCI6MjA4MDEwNjQ2Mn0.g-e8YNzEy0Z5ul1RGAhBMDj41TtWGuNPEzZz4XEGPg4";
const supabase = createClient(SUPABASE_URL, ANON_KEY);

async function checkLandingLeads() {
    console.log("🔍 Checking for Landing Page Leads (Today)...");

    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();

    const { data: leads, error } = await supabase
        .from('leads')
        .select('name, phone, created_at, status, user_id, source')
        .eq('source', 'Web Landing Page')
        .gte('created_at', todayStart)
        .order('created_at', { ascending: false });

    if (error) {
        console.error("❌ Error fetching leads:", error.message);
        return;
    }

    if (leads.length === 0) {
        console.log("❌ No leads found from 'Web Landing Page' today yet.");
    } else {
        console.log(`✅ Found ${leads.length} Leads:`);
        leads.forEach(l => {
            const time = new Date(l.created_at).toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata' });
            console.log(`- ${l.name} (${l.phone}) at ${time} | Status: ${l.status}`);
        });
    }
}

checkLandingLeads();
