const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = "https://vewqzsqddgmkslnuctvb.supabase.co";
const SUPABASE_SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDUzMDQ2MiwiZXhwIjoyMDgwMTA2NDYyfQ.pAgMGN6MtKm1A3fsKr1GIt8-qmKYhwFjSt92L_6_7us";

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function forceFix() {
    console.log("🚑 FORCE FIXING SEJAL (sejalrani72@gmail.com)...");

    const updates = {
        daily_limit: 55,
        total_leads_promised: 71, // Ensure this is set
        is_active: true,
        is_online: true,
        plan_name: 'starter',
        plan_weight: 1 // Standard weight
    };

    const { data, error } = await supabase
        .from('users')
        .update(updates)
        .eq('email', 'sejalrani72@gmail.com')
        .select();

    if (error) {
        console.error("❌ Error updating user:", error.message);
        return;
    }

    console.log("✅ User Updated. Current State:");
    console.log(JSON.stringify(data[0], null, 2));

    console.log("\n🔮 RE-CHECKING RPC...");
    const { data: rpcData, error: rpcError } = await supabase
        .rpc('get_best_assignee_for_team', { p_team_code: 'TEAMFIRE' });

    if (rpcError) {
        console.error("❌ RPC Error:", rpcError.message);
    } else {
        if (rpcData && rpcData.length > 0) {
            const winner = rpcData[0];
            const winnerEmail = winner.user_email || winner.out_user_email;
            if (winnerEmail === 'sejalrani72@gmail.com') {
                console.log("🎉 SUCCESS! Sejal is now the TOP candidate.");
            } else {
                console.log(`⚠️ Sejal is STILL NOT top candidate. Winner: ${winnerEmail}`);
            }
        } else {
            console.log("⚠️ No candidates returned.");
        }
    }
}

forceFix();
