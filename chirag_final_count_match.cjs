
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://vewqzsqddgmkslnuctvb.supabase.co';
const SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDUzMDQ2MiwiZXhwIjoyMDgwMTA2NDYyfQ.pAgMGN6MtKm1A3fsKr1GIt8-qmKYhwFjSt92L_6_7us";

const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

async function finalCountMatch() {
    console.log("🕵️‍♂️ CHIRAG TEAM FINAL COUNT MATCH (Feb 5)...\n");

    const today = new Date().toISOString().split('T')[0];

    // 1. Get ALL leads assigned to Chirag's Team
    const { data: users } = await supabase.from('users').select('id').eq('team_code', 'GJ01TEAMFIRE');
    const userIds = users.map(u => u.id);

    const { data: leads } = await supabase.from('leads')
        .select('id, source, name, created_at')
        .in('assigned_to', userIds)
        .gte('created_at', today + 'T00:00:00');

    if (!leads) return console.log("No leads found.");

    console.log(`📊 TOTAL LEADS IN CRM: ${leads.length}`);

    // Breakdown
    let metaCount = 0;
    let manualCount = 0;
    let recoveryCount = 0;

    leads.forEach(l => {
        const s = (l.source || '').toLowerCase();
        if (s.includes('meta') || s.includes('digital chirag')) metaCount++;
        else if (s.includes('manual')) manualCount++;
        else if (s.includes('recovery') || s.includes('sync')) recoveryCount++;
        else manualCount++; // default fall back
    });

    console.log(`   - Meta/Digital Chirag: ${metaCount}`);
    console.log(`   - Manual/Other:        ${manualCount}`);
    console.log(`   - Recovery/Sync:       ${recoveryCount}`); // These are basically Meta leads recovered

    const totalSystem = leads.length;
    const target = 161; // 148 + 13

    console.log(`\n🎯 TARGET (Ad Mgr + Other): ${target}`);
    console.log(`✅ ACTUAL SYSTEM COUNT:    ${totalSystem}`);

    if (totalSystem >= target - 5 && totalSystem <= target + 5) {
        console.log(`\n🎉 MATCHED! (Within margin of error for duplicates/tests)`);
    } else if (totalSystem < target) {
        console.log(`\n🚨 MISSING: We are short by ${target - totalSystem} leads.`);
        console.log(`   (Likely duplicate leads filtered out by CRM or held in 'Night_Backlog').`);
    } else {
        console.log(`\n⚠️ EXTRA: We have ${totalSystem - target} more leads than expected.`);
        console.log(`   (Maybe manual entries or cross-team transfers).`);
    }
}

finalCountMatch();
