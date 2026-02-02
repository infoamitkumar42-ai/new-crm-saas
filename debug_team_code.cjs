const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://vewqzsqddgmkslnuctvb.supabase.co';
const ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ1MzA0NjIsImV4cCI6MjA4MDEwNjQ2Mn0.g-e8YNzEy0Z5ul1RGAhBMDj41TtWGuNPEzZz4XEGPg4";
const supabase = createClient(SUPABASE_URL, ANON_KEY);

async function debugTeamCodeIssue() {
    console.log("🔍 DEBUGGING TEAM CODE ISSUE...\n");

    // 1. Find manager with ID 79c67296...
    const { data: manager } = await supabase
        .from('users')
        .select('id, name, email, role, team_code')
        .eq('id', '79c67296-b221-4ca9-a3a5-1611e690e68d')
        .single();

    if (manager) {
        console.log("Member Himanshu is linked to:");
        console.log(`  Manager: ${manager.name}`);
        console.log(`  Email: ${manager.email}`);
        console.log(`  Team Code: ${manager.team_code}`);
    }

    // 2. Check all managers and their team codes
    console.log("\n📋 ALL MANAGERS WITH TEAM CODES:");
    const { data: managers } = await supabase
        .from('users')
        .select('id, name, email, team_code')
        .eq('role', 'manager')
        .not('team_code', 'is', null)
        .order('name');

    if (managers) {
        managers.forEach(m => {
            console.log(`${m.name.padEnd(25)} | Code: ${(m.team_code || 'NONE').padEnd(15)} | ${m.email}`);
        });
    }

    // 3. Check recent member signups without manager_id
    console.log("\n⚠️ RECENT MEMBERS WITHOUT MANAGER (Last 10):");
    const { data: noManager } = await supabase
        .from('users')
        .select('id, name, email, team_code, created_at')
        .eq('role', 'member')
        .is('manager_id', null)
        .order('created_at', { ascending: false })
        .limit(10);

    if (noManager && noManager.length > 0) {
        noManager.forEach(m => {
            console.log(`  ${m.name} (${m.email}) - Team Code Used: ${m.team_code || 'NONE'}`);
        });
    } else {
        console.log("  None found - all members have managers!");
    }
}

debugTeamCodeIssue();
