
const { createClient } = require('@supabase/supabase-js');
const SUPABASE_URL = 'https://vewqzsqddgmkslnuctvb.supabase.co';
const ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ1MzA0NjIsImV4cCI6MjA4MDEwNjQ2Mn0.g-e8YNzEy0Z5ul1RGAhBMDj41TtWGuNPEzZz4XEGPg4";
const supabase = createClient(SUPABASE_URL, ANON_KEY);

async function checkFreshTest() {
    console.log("🕵️ VERIFYING FRESH TEST LEAD...");

    const { data: user } = await supabase.from('users').select('id, name').eq('email', 'demo1@gmail.com').single();
    if (!user) { console.log("Demo User Not Found"); return; }

    // Allow 5 seconds for webhook to process
    await new Promise(r => setTimeout(r, 5000));

    const { data: lead } = await supabase.from('leads')
        .select('*')
        .eq('name', 'ROBOT FRESH TEST')
        .order('created_at', { ascending: false }) // Get latest
        .limit(1)
        .single();

    if (lead) {
        console.log(`\n✅ LEAD FOUND IN DB!`);
        console.log(`   - Name: ${lead.name}`);
        console.log(`   - Assigned To: ${lead.assigned_to}`);

        if (lead.assigned_to === user.id) {
            console.log("   🎉 SUCCESS! Assigned to Target User (Demo1).");
            console.log("   🚀 IRON DOME LOGIC VERIFIED.");
        } else {
            console.log(`   ❌ Assigned to WRONG user: ${lead.assigned_to}`);
        }
    } else {
        console.log("\n❌ FAILED. Lead still not in DB.");
    }
}
checkFreshTest();
