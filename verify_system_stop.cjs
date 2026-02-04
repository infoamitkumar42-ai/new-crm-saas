const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://vewqzsqddgmkslnuctvb.supabase.co';
const ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ1MzA0NjIsImV4cCI6MjA4MDEwNjQ2Mn0.g-e8YNzEy0Z5ul1RGAhBMDj41TtWGuNPEzZz4XEGPg4";

const supabase = createClient(SUPABASE_URL, ANON_KEY);

async function verifyStop() {
    console.log("🔒 VERIFYING SYSTEM SHUTDOWN STATE...\n");

    // 1. Check for ANY Active Users
    const { count: activeCount, error: userError } = await supabase
        .from('users')
        .select('*', { count: 'exact', head: true })
        .eq('is_active', true);

    if (userError) console.error("Error checking users:", userError.message);

    if (activeCount === 0) {
        console.log("✅ USERS STATUS: SECURE (0 Active Users)");
    } else {
        console.log(`❌ USERS STATUS: RISK (${activeCount} Active Users found!)`);
        // List them if any
        const { data: activeUsers } = await supabase.from('users').select('name, email').eq('is_active', true);
        activeUsers.forEach(u => console.log(`   - ${u.name} (${u.email})`));
    }

    // 2. Check for Pending 'New' Leads (That could be assigned if someone activates)
    const { count: pendingCount, error: leadError } = await supabase
        .from('leads')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'New')
        .is('assigned_to', null);

    if (leadError) console.error("Error checking leads:", leadError.message);

    if (pendingCount === 0) {
        console.log("✅ LEADS STATUS: SECURE (0 Pending Leads)");
    } else {
        console.log(`❌ LEADS STATUS: RISK (${pendingCount} Pending Leads found!)`);
    }

    // 3. Check for recent assignments (Last 30 mins) to ensure no leak
    const thirtyMinsAgo = new Date(Date.now() - 30 * 60 * 1000).toISOString();
    const { data: recentLeads } = await supabase
        .from('leads')
        .select('name, phone, assigned_to, assigned_at')
        .gt('assigned_at', thirtyMinsAgo);

    if (recentLeads && recentLeads.length > 0) {
        console.log(`⚠️ WARNING: ${recentLeads.length} leads assigned in last 30 mins.`);
        recentLeads.forEach(l => console.log(`   - ${l.name} -> User ID: ${l.assigned_to} at ${l.assigned_at}`));
    } else {
        console.log("✅ NO RECENT ACTIVITY: No leads assigned in last 30 mins.");
    }
}

verifyStop();
