const { createClient } = require('@supabase/supabase-js');

// Use HARDCODED keys to avoid dotenv issues
const SUPABASE_URL = "https://vewqzsqddgmkslnuctvb.supabase.co";
const SUPABASE_SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDUzMDQ2MiwiZXhwIjoyMDgwMTA2NDYyfQ.pAgMGN6MtKm1A3fsKr1GIt8-qmKYhwFjSt92L_6_7us";

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function activatePooja() {
    console.log("🚀 ACTIVATING POOJA JOLLY...");

    const email = 'jollypooja5@gmail.com';
    const NEW_Daily_Limit = 5;
    const PLAN_ADDITION = 55; // Adding 55 leads as fresh quota for 999 plan (typically 50-60)
    const TARGET_TEAM = 'TEAMHIMANSHU';

    // 1. Get current status to calculate new total limit
    const { data: user, error: fetchError } = await supabase
        .from('users')
        .select('*')
        .eq('email', email)
        .single();

    if (fetchError) {
        console.error("❌ Error fetching user:", fetchError.message);
        return;
    }

    const currentReceived = user.total_leads_received || 0;
    const newTotalPromised = currentReceived + PLAN_ADDITION;

    console.log(`📊 Current Team: ${user.team_code}`);
    console.log(`📊 Current Received: ${currentReceived}`);
    console.log(`🎯 New Team: ${TARGET_TEAM}`);
    console.log(`🎯 New Promised Limit: ${newTotalPromised}`);

    // 2. Update User
    const { error: updateError } = await supabase
        .from('users')
        .update({
            is_active: true,
            plan_name: 'starter',
            daily_limit: NEW_Daily_Limit,
            total_leads_promised: newTotalPromised,
            team_code: TARGET_TEAM,
            valid_until: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // 30 Days from now
        })
        .eq('email', email);

    if (updateError) {
        console.error("❌ Update Failed:", updateError.message);
    } else {
        console.log("✅ SUCCESS! Pooja activated.");
        console.log(`   - Team: ${TARGET_TEAM}`);
        console.log(`   - Plan: Starter (5/day)`);
        console.log(`   - Quota: ${newTotalPromised} (Added +${PLAN_ADDITION})`);
    }
}

activatePooja();
