const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const supabaseUrl = 'https://vewqzsqddgmkslnuctvb.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDUzMDQ2MiwiZXhwIjoyMDgwMTA2NDYyfQ.pAgMGN6MtKm1A3fsKr1GIt8-qmKYhwFjSt92L_6_7us';
const supabase = createClient(supabaseUrl, supabaseKey);

const TEAM = 'GJ01TEAMFIRE';
const EXCLUDE = [
    'cmdarji1997@gmail.com',
    'kaushalrathod2113@gmail.com',
    'bhumitpatel.0764@gmail.com'
];
const CSV_FILE = 'CHIRAG_16_ACTIVE_MEMBERS_REPORT.csv';

(async () => {
    console.log(`=== 📊 GENERATING DETAILED REPORT FOR 16 ACTIVE MEMBERS ===`);

    const { data: users, error } = await supabase
        .from('users')
        .select('name, email, plan_name, total_leads_promised, total_leads_received, is_active')
        .eq('team_code', TEAM)
        .eq('is_active', true);

    if (error) { console.error('Error fetching users:', error); return; }

    const targetUsers = users.filter(u => !EXCLUDE.includes(u.email.toLowerCase()));

    const headers = ['Name,Email,Plan,Promised,Received,Pending'];
    const rows = [];

    console.log('\n| Name | Plan | Promised | Received | Pending |');
    console.log('|---|---|---|---|---|');

    targetUsers.forEach(u => {
        const promised = u.total_leads_promised || 0;
        const received = u.total_leads_received || 0;
        const pending = Math.max(0, promised - received);

        console.log(`| ${u.name} | ${u.plan_name} | ${promised} | ${received} | ${pending} |`);
        rows.push(`"${u.name}","${u.email}",${u.plan_name},${promised},${received},${pending}`);
    });

    const csvContent = headers.concat(rows).join('\n');
    fs.writeFileSync(CSV_FILE, csvContent);
    console.log(`\n✅ Detailed Report saved to ${CSV_FILE}`);
    console.log(`Total Target Members: ${targetUsers.length}`);

})();
