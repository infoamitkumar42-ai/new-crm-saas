
const { createClient } = require('@supabase/supabase-js');
const SUPABASE_URL = 'https://vewqzsqddgmkslnuctvb.supabase.co';
const ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ1MzA0NjIsImV4cCI6MjA4MDEwNjQ2Mn0.g-e8YNzEy0Z5ul1RGAhBMDj41TtWGuNPEzZz4XEGPg4";
const supabase = createClient(SUPABASE_URL, ANON_KEY);

async function checkChiragTeam() {
    console.log("🦁 CHIRAG TEAM (GJ01TEAMFIRE) AUDIT...\n");

    // Retrieve ALL users with Chirag's team code
    const { data: teamMembers, error } = await supabase
        .from('users')
        .select('id, name, email, plan_name, is_active, created_at')
        .eq('team_code', 'GJ01TEAMFIRE');

    if (error) { console.error("Error:", error); return; }

    const total = teamMembers.length;
    const paidActive = teamMembers.filter(u => u.plan_name !== 'none' && u.is_active).length;
    const paidInactive = teamMembers.filter(u => u.plan_name !== 'none' && !u.is_active).length;
    const noPlan = teamMembers.filter(u => u.plan_name === 'none').length;

    console.log(`📊 TEAM SUMMARY:`);
    console.log(`   - Total Members:  ${total}`);
    console.log(`   - Active (Earning): ${paidActive}`);
    console.log(`   - Inactive (Paid):  ${paidInactive} (Stopped intentionally?)`);
    console.log(`   - No Plan (Free):   ${noPlan}`);
    console.log("---------------------------------------");

    console.log("📝 MEMBER DETAILS (First 20):");
    console.table(teamMembers.slice(0, 20).map(u => ({
        Name: u.name,
        Plan: u.plan_name,
        Active: u.is_active
    })));

    if (paidInactive > 0) {
        console.log(`\n⚠️ ATTENTION: ${paidInactive} users have a Plan but are INACTIVE.`);
        teamMembers.filter(u => u.plan_name !== 'none' && !u.is_active)
            .forEach(u => console.log(`   - ${u.name} (${u.plan_name})`));
    }
}

checkChiragTeam();
