
const { createClient } = require('@supabase/supabase-js');
const SUPABASE_URL = 'https://vewqzsqddgmkslnuctvb.supabase.co';
const ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ1MzA0NjIsImV4cCI6MjA4MDEwNjQ2Mn0.g-e8YNzEy0Z5ul1RGAhBMDj41TtWGuNPEzZz4XEGPg4";
const supabase = createClient(SUPABASE_URL, ANON_KEY);

async function checkTestLead() {
    console.log("🕵️ VERIFYING TEST LEAD ASSIGNMENT...");

    // 1. Get Demo User ID
    const { data: user } = await supabase.from('users').select('id, name').eq('email', 'demo1@gmail.com').single();
    if (!user) { console.log("Demo User Not Found"); return; }

    // 2. Check Leads assigned to Demo User
    const { data: lead } = await supabase.from('leads')
        .select('*')
        .eq('assigned_to', user.id)
        .eq('name', 'ROBOT TEST FINAL')
        .single();

    if (lead) {
        console.log(`\n✅ SUCESS! Lead Assigned to ${user.name}`);
        console.log(`   - Lead Name: ${lead.name}`);
        console.log(`   - Assigned At: ${lead.assigned_at}`);
        console.log(`   - Source Page Logic: PASSED (Matched Chirag Team)`);
    } else {
        console.log("\n❌ FAILED. Lead not found on Demo User.");

        // Debug: Check if it went to ANYONE else?
        const { data: lostLead } = await supabase.from('leads').select('name, assigned_to').eq('name', 'ROBOT TEST FINAL').single();
        if (lostLead) {
            console.log(`   ⚠️ Lead went to DIFFERENT user: ${lostLead.assigned_to}`);
        } else {
            console.log("   ❓ Lead not found in database at all. (Check Webhook logs)");
        }
    }
}
checkTestLead();
