const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = "https://vewqzsqddgmkslnuctvb.supabase.co";
const SUPABASE_SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDUzMDQ2MiwiZXhwIjoyMDgwMTA2NDYyfQ.pAgMGN6MtKm1A3fsKr1GIt8-qmKYhwFjSt92L_6_7us";

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function debugRPC() {
    console.log("🔮 DEBUGGING RPC: get_best_assignee_for_team(TEAMFIRE)...");

    // Corrected signature based on webhook code
    const { data, error } = await supabase
        .rpc('get_best_assignee_for_team', {
            p_team_code: 'TEAMFIRE'
        });

    if (error) {
        console.error("❌ RPC Error:", error.message);
    } else {
        console.log("✅ Best Assignee Result:");
        console.log(JSON.stringify(data, null, 2));

        if (data && data.length > 0) {
            const winner = data[0];
            const winnerEmail = winner.user_email || winner.out_user_email;
            const winnerTotal = winner.total_received || winner.out_total_received;

            if (winnerEmail === 'sejalrani72@gmail.com') {
                console.log("\n🎉 MATCH! Sejal is the NEXT candidate.");
            } else {
                console.log(`\n⚠️ Sejal is NOT the next candidate.`);
                console.log(`   Next is: ${winnerEmail} (Total: ${winnerTotal})`);
            }
        } else {
            console.log("⚠️ No eligible users returned.");
        }
    }
}

debugRPC();
