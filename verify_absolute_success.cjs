
const { createClient } = require('@supabase/supabase-js');
const SUPABASE_URL = 'https://vewqzsqddgmkslnuctvb.supabase.co';
const ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ1MzA0NjIsImV4cCI6MjA4MDEwNjQ2Mn0.g-e8YNzEy0Z5ul1RGAhBMDj41TtWGuNPEzZz4XEGPg4";
const supabase = createClient(SUPABASE_URL, ANON_KEY);

async function verifyAbsoluteSuccess() {
    console.log("🧐 Searching for the final verification lead...");

    // Give it a moment to process
    await new Promise(r => setTimeout(r, 6000));

    const { data: lead, error } = await supabase
        .from('leads')
        .select('*')
        .eq('name', 'Himanshu Success Verification')
        .single();

    if (error || !lead) {
        console.error("❌ STALEMATE: Lead still not found in DB. This is highly unusual.");
        return;
    }

    console.log(`\n🏆 FOUND IT!`);
    console.log(`   - Name: ${lead.name}`);
    console.log(`   - Status: ${lead.status}`);
    console.log(`   - Assigned To: ${lead.assigned_to}`);

    if (lead.assigned_to) {
        const { data: user } = await supabase.from('users').select('name, email, team_code').eq('id', lead.assigned_to).single();
        console.log(`   - 👤 Assigned User: ${user.name} (${user.email})`);
        console.log(`   - 🛡️ Team: ${user.team_code}`);

        if (user.team_code === 'TEAMFIRE') {
            console.log("\n🔥🔥🔥 1000% CONFIRMED: SYSTEM IS FULLY OPERATIONAL. 🔥🔥🔥");
            console.log("Page -> Team Isolation -> Real User Assignment is working perfectly.");
        } else {
            console.log("\n❌ MISMATCH: Assigned to wrong team.");
        }
    } else {
        console.log("\n⚠️ Lead created but not assigned. Check if Himanshu Team members are Online/Active.");
    }
}

verifyAbsoluteSuccess();
