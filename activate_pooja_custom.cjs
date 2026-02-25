const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = "https://vewqzsqddgmkslnuctvb.supabase.co";
const SUPABASE_SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDUzMDQ2MiwiZXhwIjoyMDgwMTA2NDYyfQ.pAgMGN6MtKm1A3fsKr1GIt8-qmKYhwFjSt92L_6_7us";

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function activatePoojaCustom() {
    console.log("🚀 ACTIVATING POOJA (CUSTOM QUOTA)...");
    const email = 'jollypooja5@gmail.com';
    const ADD_QUOTA = 43;
    const DAILY_LIMIT = 5;

    // 1. Get current stats
    const { data: user } = await supabase.from('users').select('*').eq('email', email).single();
    if (!user) return console.error("User not found");

    const currentReceived = user.total_leads_received || 0;
    const newTotalPromised = currentReceived + ADD_QUOTA;

    console.log(`👤 User: ${user.email}`);
    console.log(`📊 Current Received: ${currentReceived}`);
    console.log(`➕ Adding Quota: ${ADD_QUOTA}`);
    console.log(`🎯 New Total Promised: ${newTotalPromised}`);

    // 2. Update
    const { error } = await supabase
        .from('users')
        .update({
            is_active: true,
            plan_name: 'starter',
            daily_limit: DAILY_LIMIT,
            total_leads_promised: newTotalPromised,
            team_code: 'TEAMHIMANSHU', // Ensure team is correct
            valid_until: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
        })
        .eq('email', email);

    if (error) {
        console.error("❌ Failed:", error.message);
    } else {
        console.log("✅ SUCCESS! Pooja Activated.");
        console.log(`   - Limit: ${DAILY_LIMIT} leads/day`);
        console.log(`   - Total Quota: ${newTotalPromised} (Will stop after ${ADD_QUOTA} more leads)`);
    }
}

activatePoojaCustom();
