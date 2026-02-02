const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://vewqzsqddgmkslnuctvb.supabase.co';
const ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ1MzA0NjIsImV4cCI6MjA4MDEwNjQ2Mn0.g-e8YNzEy0Z5ul1RGAhBMDj41TtWGuNPEzZz4XEGPg4";
const supabase = createClient(SUPABASE_URL, ANON_KEY);

async function checkRecentSignups() {
    console.log("🔍 CHECKING RECENT SIGNUPS (Last 24 Hours)...\n");

    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    const { data: recentUsers } = await supabase
        .from('users')
        .select('id, name, email, role, team_code, manager_id, created_at')
        .gte('created_at', yesterday.toISOString())
        .order('created_at', { ascending: false });

    if (!recentUsers || recentUsers.length === 0) {
        console.log("No new signups in last 24 hours.");
        return;
    }

    console.log(`Found ${recentUsers.length} recent signups:\n`);

    for (const u of recentUsers) {
        let managerName = 'NONE';
        if (u.manager_id) {
            const { data: manager } = await supabase
                .from('users')
                .select('name')
                .eq('id', u.manager_id)
                .single();
            managerName = manager?.name || u.manager_id.substring(0, 8);
        }

        const date = new Date(u.created_at).toLocaleString();
        console.log(`${u.name} (${u.email})`);
        console.log(`  Role: ${u.role}`);
        console.log(`  Team Code: ${u.team_code || 'NONE'}`);
        console.log(`  Manager: ${managerName}`);
        console.log(`  Created: ${date}`);
        console.log('---');
    }
}

checkRecentSignups();
