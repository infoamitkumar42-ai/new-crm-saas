const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://vewqzsqddgmkslnuctvb.supabase.co';
const ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ1MzA0NjIsImV4cCI6MjA4MDEwNjQ2Mn0.g-e8YNzEy0Z5ul1RGAhBMDj41TtWGuNPEzZz4XEGPg4";
const supabase = createClient(SUPABASE_URL, ANON_KEY);

async function checkHimanshuTeamCode() {
    console.log("🔍 CHECKING HIMANSHU'S TEAM CODE SETUP...\n");

    // Find all Himanshu accounts
    const { data: himanshuList } = await supabase
        .from('users')
        .select('id, name, email, role, team_code, manager_id')
        .ilike('name', '%himanshu%');

    if (!himanshuList || himanshuList.length === 0) {
        console.log("No users named Himanshu found.");
        return;
    }

    console.log(`Found ${himanshuList.length} Himanshu account(s):\n`);

    for (const h of himanshuList) {
        console.log(`Name: ${h.name}`);
        console.log(`Email: ${h.email}`);
        console.log(`Role: ${h.role}`);
        console.log(`Team Code: ${h.team_code || 'NONE'}`);
        console.log(`Manager ID: ${h.manager_id || 'NONE'}`);

        // Count team members under this Himanshu (if manager)
        if (h.role === 'manager' && h.id) {
            const { count } = await supabase
                .from('users')
                .select('id', { count: 'exact', head: true })
                .eq('manager_id', h.id);
            console.log(`Team Members: ${count || 0}`);
        }
        console.log('---');
    }

    // Also check if any members have team_code matching Himanshu's code
    const himanshuWithCode = himanshuList.find(h => h.team_code);
    if (himanshuWithCode) {
        const { data: membersWithCode } = await supabase
            .from('users')
            .select('name, email, manager_id, team_code')
            .eq('team_code', himanshuWithCode.team_code)
            .neq('id', himanshuWithCode.id);

        console.log(`\nMembers with Team Code "${himanshuWithCode.team_code}":`);
        if (membersWithCode && membersWithCode.length > 0) {
            membersWithCode.forEach(m => console.log(`  - ${m.name} (${m.email})`));
        } else {
            console.log("  No members found with this code.");
        }
    }
}

checkHimanshuTeamCode();
