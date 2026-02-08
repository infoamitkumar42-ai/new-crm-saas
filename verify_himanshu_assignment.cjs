
const { createClient } = require('@supabase/supabase-js');
const SUPABASE_URL = 'https://vewqzsqddgmkslnuctvb.supabase.co';
const ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ1MzA0NjIsImV4cCI6MjA4MDEwNjQ2Mn0.g-e8YNzEy0Z5ul1RGAhBMDj41TtWGuNPEzZz4XEGPg4";
const supabase = createClient(SUPABASE_URL, ANON_KEY);

async function verifyHimanshuAssignment() {
    console.log("🕵️ FINAL AUDIT: Verifying 'Himanshu Real Target' assignment...");

    // Wait for the webhook processing to complete
    await new Promise(resolve => setTimeout(resolve, 5000));

    // 1. Fetch the lead
    const { data: lead, error: leadError } = await supabase
        .from('leads')
        .select('*')
        .eq('name', 'Himanshu Real Target')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

    if (leadError || !lead) {
        console.error("❌ Lead 'Himanshu Real Target' NOT found in database.");
        return;
    }

    console.log(`✅ Lead Found: ${lead.name}`);
    console.log(`   - Status: ${lead.status}`);
    console.log(`   - Assigned To ID: ${lead.assigned_to}`);

    if (lead.assigned_to) {
        // 2. Fetch user details
        const { data: user, error: userError } = await supabase
            .from('users')
            .select('name, email, team_code')
            .eq('id', lead.assigned_to)
            .single();

        if (userError || !user) {
            console.error("❌ Assigned User NOT found in database.");
            return;
        }

        console.log(`\n👨‍💼 ASSIGNED USER DETAILS:`);
        console.log(`   - Name: ${user.name}`);
        console.log(`   - Email: ${user.email}`);
        console.log(`   - Team Code: ${user.team_code}`);

        if (user.team_code === 'TEAMFIRE') {
            console.log("\n🎉 TEST 100% SUCCESSFUL! The lead was correctly isolated to Himanshu's Team (TEAMFIRE).");
        } else {
            console.log(`\n❌ ERROR: Lead was assigned to the WRONG team: ${user.team_code}`);
        }
    } else {
        console.log("\n⚠️ Lead was created but NOT assigned. This usually happens if no users are Online/Active in the team.");
    }
}

verifyHimanshuAssignment();
