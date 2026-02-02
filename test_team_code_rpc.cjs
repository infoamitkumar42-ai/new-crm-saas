const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://vewqzsqddgmkslnuctvb.supabase.co';
const ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ1MzA0NjIsImV4cCI6MjA4MDEwNjQ2Mn0.g-e8YNzEy0Z5ul1RGAhBMDj41TtWGuNPEzZz4XEGPg4";
const supabase = createClient(SUPABASE_URL, ANON_KEY);

async function testTeamCodeRPC() {
    console.log("🔍 TESTING TEAM CODE RPC...\n");

    const testCodes = ['TEAMFIRE', 'WIN11', 'TEAMSIMRAN', 'TEAMRAJ', 'INVALID123'];

    for (const code of testCodes) {
        console.log(`Testing code: ${code}`);

        // Test RPC
        const { data: rpcData, error: rpcError } = await supabase.rpc('verify_team_code', { code });

        if (rpcError) {
            console.log(`  ❌ RPC Error: ${rpcError.message}`);
        } else if (rpcData && rpcData.length > 0 && rpcData[0].is_valid) {
            console.log(`  ✅ Valid! Manager: ${rpcData[0].manager_name} (${rpcData[0].manager_id.substring(0, 8)}...)`);
        } else {
            console.log(`  ❌ Invalid or not found`);
        }
        console.log('');
    }
}

testTeamCodeRPC();
