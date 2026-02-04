const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://vewqzsqddgmkslnuctvb.supabase.co';
const ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ1MzA0NjIsImV4cCI6MjA4MDEwNjQ2Mn0.g-e8YNzEy0Z5ul1RGAhBMDj41TtWGuNPEzZz4XEGPg4";

const supabase = createClient(SUPABASE_URL, ANON_KEY);

async function checkRavenLeads() {
    console.log("🔍 Checking Latest 10 Leads for Ravenjeet Kaur...\n");

    const { data: leads, error } = await supabase
        .from('leads')
        .select(`
            name, 
            phone, 
            created_at, 
            assigned_at, 
            source,
            users (email)
        `)
        .eq('users.email', 'ravenjeetkaur@gmail.com')
        .order('assigned_at', { ascending: false })
        .limit(10);

    // Supabase JS doesn't support deep filtering like .eq('users.email') gracefully in v1/v2 sometimes without proper setup
    // Let's do a JOIN manually logic to be safe and fast.

    // 1. Get User ID
    const { data: user } = await supabase.from('users').select('id').eq('email', 'ravenjeetkaur@gmail.com').single();
    if (!user) {
        console.log("❌ User not found.");
        return;
    }

    // 2. Get Leads
    const { data: userLeads, error: leadsError } = await supabase
        .from('leads')
        .select('*')
        .eq('user_id', user.id)
        .order('assigned_at', { ascending: false })
        .limit(10);

    if (leadsError) {
        console.error("Error fetching leads:", leadsError.message);
        return;
    }

    if (userLeads.length === 0) {
        console.log("✅ No leads found for Ravenjeet.");
        return;
    }

    console.log(`| Name                     | Phone       | Created UTC          | Assigned UTC         | Source          |`);
    console.log(`|--------------------------|-------------|----------------------|----------------------|-----------------|`);

    userLeads.forEach(l => {
        const created = l.created_at ? new Date(l.created_at).toISOString().replace('T', ' ').substr(5, 11) : '-';
        const assigned = l.assigned_at ? new Date(l.assigned_at).toISOString().replace('T', ' ').substr(11, 8) : 'PENDING';
        console.log(`| ${l.name.padEnd(24)} | ${l.phone.padEnd(11)} | ${created} | ${assigned} | ${l.source.padEnd(15)} |`);
    });
}

checkRavenLeads();
