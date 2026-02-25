const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = "https://vewqzsqddgmkslnuctvb.supabase.co";
const SUPABASE_SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDUzMDQ2MiwiZXhwIjoyMDgwMTA2NDYyfQ.pAgMGN6MtKm1A3fsKr1GIt8-qmKYhwFjSt92L_6_7us";

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

const USER_EMAIL = 'princyrani303@gmail.com';
const USER_ID = 'adcead16-8405-4dc2-8375-f83cef671f7b';
const TURBO_QUOTA = 500;

async function activatePrincy() {
    console.log(`🚀 ACTIVATING PRINCY RANI (${USER_EMAIL})...`);

    // 1. Calculate received since Feb 5
    const paymentDate = '2026-02-05';
    const { count, error: countError } = await supabase
        .from('leads')
        .select('*', { count: 'exact', head: true })
        .eq('assigned_to', USER_ID)
        .gte('assigned_at', paymentDate);

    if (countError) {
        console.error("❌ Error counting leads:", countError);
        return;
    }

    const receivedSincePayment = count || 0;
    const pending = Math.max(0, TURBO_QUOTA - receivedSincePayment);

    console.log(`📊 Received since ${paymentDate}: ${receivedSincePayment}`);
    console.log(`🔢 Pending Turbo Quota: ${pending}`);

    // 2. Update User
    const updates = {
        is_active: true,
        plan_name: 'turbo_boost',
        daily_limit: 15, // Recovery limit for Turbo users
        team_code: 'TEAMFIRE'
    };

    const { error: updateError } = await supabase
        .from('users')
        .update(updates)
        .eq('id', USER_ID);

    if (updateError) {
        console.error("❌ Error activating user:", updateError);
    } else {
        console.log(`✅ Princy Rani successfully activated on Turbo Plan!`);
    }
}

activatePrincy();
