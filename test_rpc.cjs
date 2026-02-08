
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://vewqzsqddgmkslnuctvb.supabase.co';
const SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDUzMDQ2MiwiZXhwIjoyMDgwMTA2NDYyfQ.pAgMGN6MtKm1A3fsKr1GIt8-qmKYhwFjSt92L_6_7us";

const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

async function testRpc() {
    console.log("🧪 Testing RPC 'assign_lead_atomically'...");

    // 1. Get an Active User (Himanshu Team)
    const { data: users } = await supabase
        .from('users')
        .select('id, name, daily_limit')
        .eq('team_code', 'TEAMFIRE')
        .eq('is_active', true)
        .limit(1);

    if (!users || users.length === 0) {
        console.error("❌ No active users found to test with.");
        return;
    }

    const testUser = users[0];
    console.log(`👤 Testing with User: ${testUser.name} (${testUser.id})`);

    // 2. Call RPC
    const { data, error } = await supabase.rpc('assign_lead_atomically', {
        p_lead_name: 'RPC TEST LEAD',
        p_phone: '9999999999',
        p_city: 'Test City',
        p_source: 'RPC Test',
        p_status: 'Test_Data',
        p_user_id: testUser.id,
        p_planned_limit: 1000 // High limit to ensure it passes quota check
    });

    if (error) {
        console.error("❌ RPC Error:", error);
    } else {
        console.log("✅ RPC Result:", data);
    }
}

testRpc();
