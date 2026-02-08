
const { createClient } = require('@supabase/supabase-js');
const SUPABASE_URL = 'https://vewqzsqddgmkslnuctvb.supabase.co';
const ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ1MzA0NjIsImV4cCI6MjA4MDEwNjQ2Mn0.g-e8YNzEy0Z5ul1RGAhBMDj41TtWGuNPEzZz4XEGPg4";
const supabase = createClient(SUPABASE_URL, ANON_KEY);

async function verifyRealLead() {
    console.log("🕵️ VERIFYING REAL LEAD: 'Ramesh Gupta'...");

    // Wait for webhook processing
    await new Promise(r => setTimeout(r, 6000));

    // 1. Check Lead in DB
    const { data: lead } = await supabase.from('leads')
        .select('*')
        .eq('name', 'Ramesh Gupta')
        .single();

    if (lead) {
        console.log(`\n✅ LEAD CREATED SUCCESSFULLY!`);
        console.log(`   - ID: ${lead.id}`);
        console.log(`   - Name: ${lead.name}`);
        console.log(`   - Status: ${lead.status}`);
        console.log(`   - Assigned To ID: ${lead.assigned_to}`);

        if (lead.assigned_to) {
            // 2. Verified who got it
            const { data: u } = await supabase.from('users').select('name, email, team_code').eq('id', lead.assigned_to).single();
            console.log(`   - 👤 ASSIGNED USER: ${u.name} (${u.email})`);
            console.log(`   - 🛡️ TEAM CODE: ${u.team_code}`);

            if (u.email === 'demo1@gmail.com') {
                console.log("\n🎯 BINGO! Lead landed EXACTLY on Demo User.");
                console.log("✅ SYSTEM VERIFIED 100%.");
            } else {
                console.log(`\n⚠️ Missed Target. Went to ${u.name}. (Check if Demo User was online/eligible)`);
            }
        } else {
            console.log("❌ Lead Created but NOT Assigned. (Check Logic Logs)");
        }
    } else {
        console.log("❌ FAILED. Lead not found in DB.");
    }
}
verifyRealLead();
