
const { createClient } = require('@supabase/supabase-js');
const SUPABASE_URL = 'https://vewqzsqddgmkslnuctvb.supabase.co';
const SERVICE_ROLE = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDUzMDQ2MiwiZXhwIjoyMDgwMTA2NDYyfQ.4xJ8e_-f5o9j_M9O9k3q8x7n4l_6p2s1t3w5y7u9i1o"; // HARDCODED FOR DEBUG ONLY (Avoid usually)
// WAIT - I DON'T HAVE SERVICE ROLE. Using Anon key (might be permission issue if Anon is blocked).
const ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ1MzA0NjIsImV4cCI6MjA4MDEwNjQ2Mn0.g-e8YNzEy0Z5ul1RGAhBMDj41TtWGuNPEzZz4XEGPg4";

const supabase = createClient(SUPABASE_URL, ANON_KEY);

async function simulateWebhookLogic() {
    console.log("🔬 FORENSIC SIMULATION START...");

    // 1. MOCK DATA
    const name = "Ramesh Gupta Simulation";
    const phone = "9123456789";
    const pageId = "61578124993244";
    const city = "Mumbai";
    const formId = "SIMULATION_FORM";

    // 2. LOGIC STEP 1: Page Mapping
    const { data: pageData, error: pageError } = await supabase.from('meta_pages').select('*').eq('page_id', pageId).single();
    if (pageError) { console.error("❌ Page Lookup Failed:", pageError); return; }

    console.log(`✅ Page Found: ${pageData.page_name} -> Team: ${pageData.team_id}`);
    const requiredTeamCode = pageData.team_id;

    // 3. LOGIC STEP 2: Find Users
    const { data: teamUsers, error: usersError } = await supabase
        .from('users')
        .select('id, name, leads_today, daily_limit, is_active, is_online, team_code')
        .eq('team_code', requiredTeamCode)
        .eq('is_active', true)
        .eq('is_online', true);

    if (usersError) { console.error("❌ Users Lookup Failed:", usersError); return; }
    console.log(`✅ Eligible Users Found: ${teamUsers.length}`);

    if (teamUsers.length === 0) {
        console.log("⚠️ No users found! Simulation Stops.");
        return;
    }

    // 4. LOGIC STEP 3: Sorting (Fewest First)
    const sorted = teamUsers.sort((a, b) => (a.leads_today || 0) - (b.leads_today || 0));
    const targetUser = sorted[0];
    console.log(`🎯 Target User: ${targetUser.name} (Leads Today: ${targetUser.leads_today})`);

    // 5. LOGIC STEP 4: Insert Lead (THE CRITICAL PART)
    // Webhook uses simplified insert
    const insertPayload = {
        name,
        phone,
        city,
        source: `Meta - ${pageData.page_name} (SIMULATION)`,
        status: 'Assigned',
        form_id: formId,
        user_id: targetUser.id,
        assigned_to: targetUser.id,
        assigned_at: new Date().toISOString()
    };

    console.log("Attempting Insert...", insertPayload);
    const { data: inserted, error: insertError } = await supabase.from('leads').insert(insertPayload).select();

    if (insertError) {
        console.error("❌ INSERT FAILED:", insertError);
        console.error("Reason:", insertError.message, insertError.details, insertError.hint);
    } else {
        console.log("✅ INSERT SUCCESS! ID:", inserted[0]?.id);
    }
}

simulateWebhookLogic();
