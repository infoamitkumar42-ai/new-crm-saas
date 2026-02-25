const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const supabaseUrl = 'https://vewqzsqddgmkslnuctvb.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDUzMDQ2MiwiZXhwIjoyMDgwMTA2NDYyfQ.pAgMGN6MtKm1A3fsKr1GIt8-qmKYhwFjSt92L_6_7us';
const supabase = createClient(supabaseUrl, supabaseKey);

(async () => {
    console.log('=== VICTIM URGENCY ANALYSIS ===');

    // Read the previously identified victims
    let victims = [];
    try {
        victims = JSON.parse(fs.readFileSync('c:\\Users\\HP\\Downloads\\new-crm-saas\\expired_victims.json', 'utf8'));
    } catch (e) {
        console.error('Could not read expired_victims.json');
        return;
    }

    const { data: users } = await supabase
        .from('users')
        .select('email, daily_limit, valid_until')
        .in('email', victims.map(v => v.email));

    const now = new Date();

    console.log(`| Name | Pending | Daily Limit | Days Needed | Time Left | Status |`);
    console.log(`|---|---|---|---|---|---|`);

    for (const v of victims) {
        const u = users.find(user => user.email === v.email);
        if (!u) continue;

        const limit = u.daily_limit || 1; // Avoid divide by zero
        const daysNeeded = Math.ceil(v.pending / limit);

        const expiry = new Date(u.valid_until);
        const timeLeftMs = expiry.getTime() - now.getTime();
        const daysLeft = timeLeftMs > 0 ? (timeLeftMs / (1000 * 60 * 60 * 24)).toFixed(1) : 0;

        let status = '';
        if (daysLeft <= 0) {
            status = '🚨 ALREADY EXPIRED';
        } else if (daysLeft < daysNeeded) {
            status = '⚠️ WILL LOSE ' + (v.pending - Math.ceil(daysLeft * limit)) + ' LEADS';
        } else {
            status = '✅ SAFE';
        }

        console.log(`| ${v.name} | ${v.pending} | ${limit} | ${daysNeeded} Days | ${daysLeft} Days | ${status} |`);
    }

})();
