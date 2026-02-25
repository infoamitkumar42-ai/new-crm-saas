const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const supabaseUrl = 'https://vewqzsqddgmkslnuctvb.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDUzMDQ2MiwiZXhwIjoyMDgwMTA2NDYyfQ.pAgMGN6MtKm1A3fsKr1GIt8-qmKYhwFjSt92L_6_7us';
const supabase = createClient(supabaseUrl, supabaseKey);

const TEAM = 'GJ01TEAMFIRE';
const CSV_FILE = 'CHIRAG_OVER_QUOTA_ACTIVE_REPORT.csv';

(async () => {
    console.log(`=== 🕵️ AUDITING OVER-QUOTA ACTIVE USERS: ${TEAM} ===`);

    const { data: users, error } = await supabase
        .from('users')
        .select('name, email, plan_name, total_leads_promised, total_leads_received, is_active')
        .eq('team_code', TEAM)
        .eq('is_active', true);

    if (error) { console.error('Error fetching users:', error); return; }

    const overQuotaUsers = users.filter(u => {
        const promised = u.total_leads_promised || 0;
        const received = u.total_leads_received || 0;
        return promised > 0 && received >= promised;
    });

    console.log(`Found ${overQuotaUsers.length} active users who are over-quota.`);

    const headers = ['Name,Email,Plan,Promised,Received,Overby'];
    const rows = overQuotaUsers.map(u => {
        const promised = u.total_leads_promised || 0;
        const received = u.total_leads_received || 0;
        const overBy = received - promised;
        return `"${u.name}","${u.email}",${u.plan_name},${promised},${received},${overBy}`;
    });

    const csvContent = headers.concat(rows).join('\n');
    fs.writeFileSync(CSV_FILE, csvContent);
    console.log(`✅ Report saved to ${CSV_FILE}`);

    if (overQuotaUsers.length > 0) {
        console.log('\nSample results:');
        overQuotaUsers.slice(0, 5).forEach(u => {
            console.log(`- ${u.name}: ${u.total_leads_received}/${u.total_leads_promised}`);
        });
    }

})();
