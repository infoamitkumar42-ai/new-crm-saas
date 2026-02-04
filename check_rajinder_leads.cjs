const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://vewqzsqddgmkslnuctvb.supabase.co';
const ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ1MzA0NjIsImV4cCI6MjA4MDEwNjQ2Mn0.g-e8YNzEy0Z5ul1RGAhBMDj41TtWGuNPEzZz4XEGPg4";

const supabase = createClient(SUPABASE_URL, ANON_KEY);

async function checkRajinderLeads() {
    console.log("🔍 Checking Latest 20 Leads for Rajinder...\n");

    const { data: leads, error } = await supabase
        .from('leads')
        .select('name, phone, created_at, source, assigned_at, user_id')
        .eq('user_id', 'f7022153-3a7e-42b7-8b1b-e307bb9767f2') // Rajinder's ID
        .order('created_at', { ascending: false })
        .limit(20);

    if (error) {
        console.error("Error fetching leads:", error.message);
        return;
    }

    if (leads.length === 0) {
        console.log("✅ No leads found for Rajinder.");
        return;
    }

    console.log(`| Name                     | Phone       | Created At (UTC)    | Source          |`);
    console.log(`|--------------------------|-------------|---------------------|-----------------|`);

    leads.forEach(l => {
        const timeStr = new Date(l.created_at).toISOString().replace('T', ' ').substr(0, 19);
        console.log(`| ${l.name.padEnd(24)} | ${l.phone.padEnd(11)} | ${timeStr} | ${l.source.padEnd(15)} |`);
    });
}

checkRajinderLeads();
