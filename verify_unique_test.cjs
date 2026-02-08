
const { createClient } = require('@supabase/supabase-js');
const SUPABASE_URL = 'https://vewqzsqddgmkslnuctvb.supabase.co';
const ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ1MzA0NjIsImV4cCI6MjA4MDEwNjQ2Mn0.g-e8YNzEy0Z5ul1RGAhBMDj41TtWGuNPEzZz4XEGPg4";
const supabase = createClient(SUPABASE_URL, ANON_KEY);

async function checkUniqueTest() {
    console.log("🕵️ VERIFYING UNIQUE TEST LEAD...");

    // Allow 5 seconds for webhook to process
    await new Promise(r => setTimeout(r, 5000));

    const { data: lead } = await supabase.from('leads')
        .select('*')
        .eq('name', 'UNIQUE TEST 888')
        .single();

    if (lead) {
        console.log(`\n✅ LEAD FOUND IN DB!`);
        console.log(`   - Name: ${lead.name}`);
        console.log(`   - Status: ${lead.status}`);
        console.log(`   - Assigned To ID: ${lead.assigned_to}`);

        // Find who owns this ID
        if (lead.assigned_to) {
            const { data: user } = await supabase.from('users').select('name, email').eq('id', lead.assigned_to).single();
            console.log(`   - Assigned To Name: ${user.name} (${user.email})`);

            if (user.email === 'demo1@gmail.com') {
                console.log("   🎉 JACKPOT! Assigned to Target User.");
            } else {
                console.log("   ⚠️ Assigned to someone else (Maybe quota/rotation logic kicked in?)");
            }
        } else {
            console.log("   ⚠️ Lead Created but Unassigned (Check Status)");
        }

    } else {
        console.log("\n❌ FAILED. Lead still not in DB.");
    }
}
checkUniqueTest();
