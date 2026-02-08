
const { createClient } = require('@supabase/supabase-js');
const SUPABASE_URL = 'https://vewqzsqddgmkslnuctvb.supabase.co';
const ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ1MzA0NjIsImV4cCI6MjA4MDEwNjQ2Mn0.g-e8YNzEy0Z5ul1RGAhBMDj41TtWGuNPEzZz4XEGPg4";
const supabase = createClient(SUPABASE_URL, ANON_KEY);

async function checkHimanshuTest() {
    console.log("🕵️ VERIFYING HIMANSHU LEAD: 'Final Verify Himanshu'...");

    // Wait for webhook
    await new Promise(r => setTimeout(r, 6000));

    // Get Lead
    const { data: lead } = await supabase.from('leads')
        .select('*')
        .eq('name', 'Final Verify Himanshu')
        .single();

    if (lead) {
        console.log(`\n✅ LEAD CREATED.`);
        console.log(`   - Name: ${lead.name}`);

        if (lead.assigned_to) {
            const { data: u } = await supabase.from('users').select('name, email, team_code').eq('id', lead.assigned_to).single();
            console.log(`   - 👤 ASSIGNED TO: ${u.name} (${u.email})`);
            console.log(`   - 🛡️ TEAM CODE: ${u.team_code}`);

            if (u.team_code === 'TEAMFIRE') {
                console.log("\n🔥🔥🔥 SUCCESS! Lead stayed in TEAMFIRE. 🔥🔥🔥");
            } else {
                console.log(`\n❌ WRONG TEAM: Lead went to Team '${u.team_code}'`);
            }
        } else {
            console.log("❌ Unassigned. (Check if users are active/online)");
        }
    } else {
        console.log("❌ FAILED. Lead not found in DB.");
    }
}
checkHimanshuTest();
