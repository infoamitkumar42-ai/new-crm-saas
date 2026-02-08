
const { createClient } = require('@supabase/supabase-js');
const SUPABASE_URL = 'https://vewqzsqddgmkslnuctvb.supabase.co';
const ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ1MzA0NjIsImV4cCI6MjA4MDEwNjQ2Mn0.g-e8YNzEy0Z5ul1RGAhBMDj41TtWGuNPEzZz4XEGPg4";
const supabase = createClient(SUPABASE_URL, ANON_KEY);

async function checkAshwinProfile() {
    console.log("🕵️ INSPECTING ASHWIN...");
    const { data: user } = await supabase.from('users').select('*').eq('email', 'jogadiyaashwin61@gmail.com').single();

    if (user) {
        console.log(`✅ FOUND ASHWIN:`);
        console.log(`   - Name: ${user.name}`);
        console.log(`   - Team Code: '${user.team_code}'`); // THIS IS KEY
        console.log(`   - Manager ID: ${user.manager_id}`);
        console.log(`   - Plan: ${user.plan_name}`);

        // Also check Chirag's ID to compare
        const { data: chirag } = await supabase.from('users').select('id, team_code').eq('email', 'chirag01@gmail.com').single();
        console.log(`\n👨‍💼 COMPARISON WITH CHIRAG:`);
        console.log(`   - Chirag ID: ${chirag.id}`);
        console.log(`   - Chirag Team: '${chirag.team_code}'`);

        if (user.team_code !== chirag.team_code) {
            console.log("\n❌ MISMATCH! Ashwin is NOT in Chirag's Team Code.");
        } else {
            console.log("\n✅ MATCH! Ashwin IS in Chirag's Team.");
        }
    } else {
        console.log("❌ Ashwin user not found.");
    }
}

checkAshwinProfile();
