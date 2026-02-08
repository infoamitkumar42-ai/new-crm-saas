
const { createClient } = require('@supabase/supabase-js');
const SUPABASE_URL = 'https://vewqzsqddgmkslnuctvb.supabase.co';
const ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ1MzA0NjIsImV4cCI6MjA4MDEwNjQ2Mn0.g-e8YNzEy0Z5ul1RGAhBMDj41TtWGuNPEzZz4XEGPg4";
const supabase = createClient(SUPABASE_URL, ANON_KEY);

async function finalGoldenVerify() {
    console.log("🧐 Searching for Golden Lead...");

    // Tiny delay
    await new Promise(r => setTimeout(r, 2000));

    const { data: lead } = await supabase.from('leads')
        .select('*')
        .eq('name', 'Himanshu Golden Verification')
        .single();

    if (lead) {
        console.log(`✅ FOUND! Name: ${lead.name}`);
        console.log(`   - Status: ${lead.status}`);

        if (lead.assigned_to) {
            const { data: user } = await supabase.from('users').select('name, email, team_code').eq('id', lead.assigned_to).single();
            console.log(`   - 👤 Assigned To: ${user.name} (${user.email})`);
            console.log(`   - 🛡️ Team: ${user.team_code}`);

            if (user.team_code === 'TEAMFIRE') {
                console.log("\n🎊 100% SUCCESS: Lead isolated to Himanshu Team FIRE.");
            } else {
                console.log("\n❌ FAIL: Isolated to WRONG team.");
            }
        } else {
            console.log("⚠️ Created but not assigned.");
        }
    } else {
        console.log("❌ Lead not found.");
    }
}

finalGoldenVerify();
