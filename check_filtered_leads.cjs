
const { createClient } = require('@supabase/supabase-js');
const SUPABASE_URL = 'https://vewqzsqddgmkslnuctvb.supabase.co';
const ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ1MzA0NjIsImV4cCI6MjA4MDEwNjQ2Mn0.g-e8YNzEy0Z5ul1RGAhBMDj41TtWGuNPEzZz4XEGPg4";
const supabase = createClient(SUPABASE_URL, ANON_KEY);

async function checkDuplicateLeads() {
    console.log("🧐 Checking for 'Duplicate' or 'Test' leads in the last 10 minutes...");
    const tenMinsAgo = new Date(Date.now() - 10 * 60 * 1000).toISOString();
    const { data: leads, error } = await supabase
        .from('leads')
        .select('*')
        .in('status', ['Duplicate', 'Test', 'Invalid'])
        .gt('created_at', tenMinsAgo);

    if (error) {
        console.error("❌ Error:", error);
        return;
    }

    if (leads && leads.length > 0) {
        leads.forEach(l => {
            console.log(`[${l.created_at}] Name: ${l.name} | Status: ${l.status}`);
        });
    } else {
        console.log("📭 No filtered leads found.");
    }
}

checkDuplicateLeads();
