
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://vewqzsqddgmkslnuctvb.supabase.co';
const SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDUzMDQ2MiwiZXhwIjoyMDgwMTA2NDYyfQ.pAgMGN6MtKm1A3fsKr1GIt8-qmKYhwFjSt92L_6_7us";

const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

async function check() {
    console.log("🕵️ DIAGNOSING MANUAL LEAD ISSUE For Chirag's Team...");

    // 1. Check if Sample Lead exists
    const samplePhone = '9624249683'; // Dharmesh Donda
    const { data: leads, error: lError } = await supabase
        .from('leads')
        .select('*')
        .eq('phone_number', samplePhone);

    if (leads && leads.length > 0) {
        console.log(`❌ BLOCKER FOUND: Lead ${samplePhone} ALREADY EXISTS!`);
        console.log("   Status:", leads[0].status);
        console.log("   Assigned To:", leads[0].assigned_to);
        console.log("   (The SQL script skips existing numbers to avoid duplicates)");
    } else {
        console.log("✅ Lead does not exist. (Duplicate check is NOT the blocker)");
    }

    // 2. Check Team Members
    const { data: team, error: tError } = await supabase
        .from('users')
        .select('id, name, plan_name, is_active')
        .eq('team_code', 'GJ01TEAMFIRE');

    if (team && team.length > 0) {
        console.log(`\n✅ FOUND ${team.length} MEMBERS in 'GJ01TEAMFIRE'.`);
        const eligible = team.filter(u => u.is_active && ['starter', 'supervisor', 'manager', 'weekly_boost', 'turbo_boost'].includes(u.plan_name?.toLowerCase()));
        console.log(`   Eligible for distribution: ${eligible.length}`);
        if (eligible.length === 0) {
            console.log("   ⚠️ NO ELIGIBLE MEMBERS! Check plan names case sensitivity.");
            console.table(team);
        }
    } else {
        console.log("\n❌ TEAM 'GJ01TEAMFIRE' NOT FOUND OR EMPTY.");
    }
}

check();
