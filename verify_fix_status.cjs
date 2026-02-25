const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const supabaseUrl = 'https://vewqzsqddgmkslnuctvb.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDUzMDQ2MiwiZXhwIjoyMDgwMTA2NDYyfQ.pAgMGN6MtKm1A3fsKr1GIt8-qmKYhwFjSt92L_6_7us';
const supabase = createClient(supabaseUrl, supabaseKey);

(async () => {
    console.log('=== VERIFYING READINESS OF 11 USERS ===');

    let victims = [];
    try {
        victims = JSON.parse(fs.readFileSync('c:\\Users\\HP\\Downloads\\new-crm-saas\\expired_victims.json', 'utf8'));
    } catch (e) {
        console.error('Could not read expired_victims.json');
        return;
    }

    const { data: users, error } = await supabase
        .from('users')
        .select('name, email, is_active, is_online, valid_until, daily_limit, team_code')
        .in('email', victims.map(v => v.email));

    if (error || !users) {
        console.error('Failed to fetch users:', error?.message);
        return;
    }

    console.log(`| Name | Active | Online | Valid | Limit | Team | Status |`);
    console.log(`|---|---|---|---|---|---|---|`);

    const now = new Date();
    let allGood = true;

    for (const v of victims) {
        const u = users.find(user => user.email === v.email);
        if (!u) {
            console.log(`| ${v.name} | ❌ NOT FOUND | - | - | - | - | ❌ ERROR |`);
            allGood = false;
            continue;
        }

        const isValid = new Date(u.valid_until) > now;
        const hasLimit = (u.daily_limit || 0) > 0;
        const hasTeam = (u.team_code || u.team_id) ? true : false;
        const isActive = u.is_active;

        let status = '✅ READY';
        let issues = [];

        if (!isValid) issues.push('Expired');
        if (!hasLimit) issues.push('No Limit');
        if (!hasTeam) issues.push('No Team');
        if (!isActive) issues.push('Inactive');

        if (issues.length > 0) {
            status = '❌ ' + issues.join(', ');
            allGood = false;
        }

        console.log(`| ${u.name} | ${u.is_active} | ${u.is_online} | ${isValid} | ${u.daily_limit} | ${u.team_code || u.team_id || '❌ NONE'} | ${status} |`);

        // Auto-fix Team if missing (Assign to TEAMFIRE as default for these users)
        if (!hasTeam) {
            console.log(`  ⚠️ Fixing Team for ${u.name}... set to TEAMFIRE`);
            await supabase.from('users').update({ team_code: 'TEAMFIRE', team_id: 'TEAMFIRE' }).eq('email', u.email);
        }
    }

    if (allGood) console.log('\n✅ All users are configured correctly.');
    else console.log('\n⚠️ Some users had issues (Team/Limit). Auto-fixes attempted.');

})();
