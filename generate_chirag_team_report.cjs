const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const supabaseUrl = 'https://vewqzsqddgmkslnuctvb.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDUzMDQ2MiwiZXhwIjoyMDgwMTA2NDYyfQ.pAgMGN6MtKm1A3fsKr1GIt8-qmKYhwFjSt92L_6_7us';
const supabase = createClient(supabaseUrl, supabaseKey);

const TEAM = 'GJ01TEAMFIRE';
const CSV_FILE = 'CHIRAG_TEAM_AUDIT_REPORT.csv';

(async () => {
    console.log(`=== 🕵️ AUDITING CHIRAG'S TEAM (${TEAM}) ===`);

    // 1. Get all users in Chirag's Team
    const { data: users, error } = await supabase
        .from('users')
        .select('id, name, email, plan_name, is_active, total_leads_promised, total_leads_received, updated_at')
        .eq('team_code', TEAM);

    if (error) { console.error('Error fetching users:', error); return; }

    console.log(`Found ${users.length} members in ${TEAM}.`);

    const headers = ['Name,Email,Plan,Status,Promised_Leads,Received_Leads,Pending_Quota,Last_Update'];
    const rows = [];

    let activeCount = 0;
    let expiredCount = 0;
    let pendingQuotaCount = 0;

    for (const user of users) {
        const promised = user.total_leads_promised || 0;
        const received = user.total_leads_received || 0;
        const pending = Math.max(0, promised - received);

        let status = user.is_active ? 'Active' : 'Inactive';

        if (user.is_active) activeCount++;
        else expiredCount++;

        if (pending > 0) pendingQuotaCount++;

        const lastUpdate = user.updated_at ? new Date(user.updated_at).toLocaleDateString() : 'N/A';

        rows.push(`"${user.name}","${user.email}",${user.plan_name},${status},${promised},${received},${pending},${lastUpdate}`);
    }

    const csvContent = headers.concat(rows).join('\n');
    fs.writeFileSync(CSV_FILE, csvContent);
    console.log(`\n✅ Detailed Audit Report saved to ${CSV_FILE}`);

    console.log(`\n--- SUMMARY STATS ---`);
    console.log(`Total Members: ${users.length}`);
    console.log(`Active Members: ${activeCount}`);
    console.log(`Expired/Inactive Members: ${expiredCount}`);
    console.log(`Users with Pending Quota: ${pendingQuotaCount}`);
    console.log(`----------------------\n`);

})();
