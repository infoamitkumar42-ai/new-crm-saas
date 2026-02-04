const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://vewqzsqddgmkslnuctvb.supabase.co';
const ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ1MzA0NjIsImV4cCI6MjA4MDEwNjQ2Mn0.g-e8YNzEy0Z5ul1RGAhBMDj41TtWGuNPEzZz4XEGPg4";
const supabase = createClient(SUPABASE_URL, ANON_KEY);

async function checkRecentAssignments() {
    console.log("🔍 Checking for Assignments in Last 15 Minutes...\n");

    const fifteenMinsAgo = new Date(Date.now() - 15 * 60 * 1000).toISOString();

    const { data: leads, error } = await supabase
        .from('leads')
        .select(`
            id,
            assigned_at, 
            assigned_to,
            created_at,
            name,
            users (email, name, plan_name)
        `)
        .gt('assigned_at', fifteenMinsAgo)
        .order('assigned_at', { ascending: false });

    if (error) {
        console.error("Error:", error.message);
        return;
    }

    if (!leads || leads.length === 0) {
        console.log("✅ NO LEAKS DETECTED (0 Assignments in last 15 mins).");
    } else {
        console.log(`❌ LEAK DETECTED! ${leads.length} leads assigned recently:`);
        leads.forEach(l => {
            const userName = l.users?.name || 'Unknown';
            const userEmail = l.users?.email || 'Unknown';
            const time = new Date(l.assigned_at).toISOString().substr(11, 8);
            console.log(`   - ${time} | ${l.name} -> ${userName} (${userEmail})`);
        });
    }
}

checkRecentAssignments();
