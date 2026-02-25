const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const supabaseUrl = 'https://vewqzsqddgmkslnuctvb.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDUzMDQ2MiwiZXhwIjoyMDgwMTA2NDYyfQ.pAgMGN6MtKm1A3fsKr1GIt8-qmKYhwFjSt92L_6_7us';
const supabase = createClient(supabaseUrl, supabaseKey);

const TEAM = 'GJ01TEAMFIRE';
const CSV_FILE = 'CHIRAG_WEEKLY_BOOSTER_AUDIT.csv';

(async () => {
    console.log(`=== 🕵️ AUDITING WEEKLY BOOSTERS: ${TEAM} ===`);

    const { data: users, error } = await supabase
        .from('users')
        .select('name, email, plan_name, total_leads_promised, total_leads_received, is_active')
        .eq('team_code', TEAM)
        .ilike('plan_name', '%boost%');

    if (error) { console.error('Error fetching users:', error); return; }

    console.log(`Found ${users.length} users with "boost" plans in Chirag's team.`);

    const headers = ['Name,Email,Plan,Status,Promised,Received,Pending'];
    const rows = [];

    let overQuotaCount = 0;
    let activeOverQuotaCount = 0;

    for (const user of users) {
        const promised = user.total_leads_promised || 0;
        const received = user.total_leads_received || 0;
        const pending = Math.max(0, promised - received);
        const status = user.is_active ? 'Active' : 'Inactive';

        if (promised > 0 && received >= promised) {
            overQuotaCount++;
            if (user.is_active) activeOverQuotaCount++;
        }

        rows.push(`"${user.name}","${user.email}",${user.plan_name},${status},${promised},${received},${pending}`);
    }

    const csvContent = headers.concat(rows).join('\n');
    fs.writeFileSync(CSV_FILE, csvContent);
    console.log(`✅ Weekly Booster Audit saved to ${CSV_FILE}`);

    console.log(`\n--- BOOSTER SUMMARY ---`);
    console.log(`Total Boosters: ${users.length}`);
    console.log(`Over-Quota Boosters: ${overQuotaCount}`);
    console.log(`Active Over-Quota Boosters: ${activeOverQuotaCount}`);
    console.log(`------------------------\n`);

    if (activeOverQuotaCount > 0) {
        console.log('🚨 ALERT: Some boosters are active but over quota!');
    }

})();
