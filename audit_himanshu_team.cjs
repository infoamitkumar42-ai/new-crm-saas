
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://vewqzsqddgmkslnuctvb.supabase.co';
const SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDUzMDQ2MiwiZXhwIjoyMDgwMTA2NDYyfQ.pAgMGN6MtKm1A3fsKr1GIt8-qmKYhwFjSt92L_6_7us";

const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

async function auditTeam() {
    console.log("🕵️‍♂️ AUDITING HIMANSHU TEAM (TEAMFIRE)...");

    const now = new Date(); // Current Time

    // 1. Get All 'Active' marked users in Team
    const { data: users } = await supabase.from('users')
        .select('id, name, email, plan_name, valid_until, is_active, daily_limit')
        .eq('team_code', 'TEAMFIRE')
        .eq('is_active', true); // Check only those marked active

    if (!users) { console.log("No users."); return; }

    console.log(`Found ${users.length} users marked as 'Active'. Checking validity...`);

    let realActive = 0;
    let expiredButActive = 0;
    const expiredList = [];

    users.forEach(u => {
        let isValid = false;

        // Logic: active if valid_until is present AND in future
        if (u.valid_until) {
            const expiry = new Date(u.valid_until);
            if (expiry > now) {
                isValid = true;
            }
        }

        if (isValid) {
            realActive++;
        } else {
            expiredButActive++;
            expiredList.push({
                Name: u.name,
                Email: u.email,
                Plan: u.plan_name,
                ValidUntil: u.valid_until ? new Date(u.valid_until).toLocaleDateString() : 'NULL'
            });
        }
    });

    console.log("\n📊 AUDIT RESULTS:");
    console.log(`✅ Genuine Paid Active Users: ${realActive}`);
    console.log(`⚠️ EXPIRED/NULL BUT ACTIVE (Leakage): ${expiredButActive}`);

    if (expiredList.length > 0) {
        console.log("\n🛑 LIST OF USERS TO STOP (Sample 10):");
        console.table(expiredList.slice(0, 10)); // Show top 10

        console.log("\n💡 Recommendation: Run a script to set is_active=false for these users.");
    }
}

auditTeam();
