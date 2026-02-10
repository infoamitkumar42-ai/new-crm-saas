const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const SUPABASE_URL = "https://vewqzsqddgmkslnuctvb.supabase.co";
const SUPABASE_SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDUzMDQ2MiwiZXhwIjoyMDgwMTA2NDYyfQ.pAgMGN6MtKm1A3fsKr1GIt8-qmKYhwFjSt92L_6_7us";

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function verifyMappingConsistency() {
    console.log('--- VERIFYING TEAM CODE CONSISTENCY ---');

    // 1. Get the 17 users I just fixed (they now have team_code, let's see if it matches manager)
    // Actually, I'll just check if any user in the DB has a team_code different from their manager's team_code
    const { data: mismatches, error } = await supabase
        .from('users')
        .select(`
            name, 
            email, 
            team_code, 
            manager_id
        `)
        .not('manager_id', 'is', null)
        .not('team_code', 'is', null);

    if (error) {
        console.error(error);
        return;
    }

    console.log(`Checking ${mismatches.length} users for manager/team alignment...`);

    // Cache manager team codes
    const managerTeams = {};
    const managerIds = [...new Set(mismatches.map(m => m.manager_id))];
    const { data: managers } = await supabase.from('users').select('id, team_code').in('id', managerIds);
    if (managers) {
        managers.forEach(m => managerTeams[m.id] = m.team_code);
    }

    let conflicts = 0;
    mismatches.forEach(u => {
        const expectedTeam = managerTeams[u.manager_id];
        if (expectedTeam && u.team_code !== expectedTeam) {
            console.log(`❌ Conflict: ${u.name} (${u.email}) is in ${u.team_code} but Manager is in ${expectedTeam}`);
            conflicts++;
        }
    });

    console.log(`Found ${conflicts} conflicts out of ${mismatches.length} checked.`);

    // 2. Check Jashanpreet's Payment description (sometimes Razorpay notes have the team code)
    const { data: jPayments } = await supabase.from('payments').select('*').ilike('email', 'jashanpreet0479@gmail.com');
    console.log('\nJashanpreet Payment Data:');
    console.log(JSON.stringify(jPayments, null, 2));
}

verifyMappingConsistency();
