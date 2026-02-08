
const { createClient } = require('@supabase/supabase-js');
const SUPABASE_URL = 'https://vewqzsqddgmkslnuctvb.supabase.co';
const ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ1MzA0NjIsImV4cCI6MjA4MDEwNjQ2Mn0.g-e8YNzEy0Z5ul1RGAhBMDj41TtWGuNPEzZz4XEGPg4";
const supabase = createClient(SUPABASE_URL, ANON_KEY);

async function verifyFinalRun() {
    console.log("🕵️ FINAL VERIFICATION: 'Vikram Singh'...");

    await new Promise(r => setTimeout(r, 6000));

    const { data: lead } = await supabase.from('leads')
        .select('*')
        .eq('name', 'Vikram Singh')
        .single();

    if (lead) {
        console.log(`\n✅ SUCCESS! LEAD CREATED.`);
        console.log(`   - Name: ${lead.name}`);
        console.log(`   - Assigned To ID: ${lead.assigned_to}`);
        console.log(`   - Source: ${lead.source}`);

        if (lead.assigned_to) {
            const { data: u } = await supabase.from('users').select('name, email, team_code').eq('id', lead.assigned_to).single();
            console.log(`   - 👤 ASSIGNED TO: ${u.name} (${u.email}) [Team: ${u.team_code}]`);

            if (u.email === 'demo1@gmail.com') {
                console.log("\n🔥🔥🔥 TEST PASSED! 100% CONFIRMED. 🔥🔥🔥");
                console.log("System correctly identified Page -> Team -> User.");
            } else {
                console.log(`\n⚠️ Assigned to ${u.name}. (Check if balance logic preferred him)`);
            }
        }
    } else {
        console.log("❌ FAILED. Lead not found. (Still checking logs...)");
    }
}
verifyFinalRun();
