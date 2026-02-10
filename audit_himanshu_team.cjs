const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = "https://vewqzsqddgmkslnuctvb.supabase.co";
const SUPABASE_SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDUzMDQ2MiwiZXhwIjoyMDgwMTA2NDYyfQ.pAgMGN6MtKm1A3fsKr1GIt8-qmKYhwFjSt92L_6_7us";

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function auditHimanshuTeam() {
    console.log("🔍 Auditing Himanshu's Team Performance...");

    const managerIds = [
        '9dd68ace-a5a7-46d8-b677-3483b5bb0841',
        '79c67296-b221-4ca9-a3a5-1611e690e68d'
    ];

    const { data: users, error } = await supabase
        .from('users')
        .select('name, email, leads_today, daily_limit, is_online, is_active, payment_status')
        .in('manager_id', managerIds)
        .order('leads_today', { ascending: false });

    if (error) {
        console.error("❌ Error fetching users:", error.message);
        return;
    }

    const receivedLeads = users.filter(u => u.leads_today > 0);
    const waitingOnline = users.filter(u => u.leads_today === 0 && u.is_online);
    const offlineOrInactive = users.filter(u => u.leads_today === 0 && !u.is_online);

    console.log(`\n📊 SUMMARY:`);
    console.log(`- Total Members: ${users.length}`);
    console.log(`- Received Leads: ${receivedLeads.length}`);
    console.log(`- Waiting (Online): ${waitingOnline.length}`);
    console.log(`- Offline/Paused: ${offlineOrInactive.length}`);

    console.log(`\n✅ LEAD RECEIVERS (Today):`);
    receivedLeads.forEach(u => {
        console.log(`- ${u.name.padEnd(25)}: ${u.leads_today} Leads`);
    });

    console.log(`\n⏳ WAITING (Online & Ready):`);
    waitingOnline.forEach(u => {
        console.log(`- ${u.name.padEnd(25)} (0 leads)`);
    });

    console.log(`\n⚠️ OFFLINE / PAUSED (0 Leads):`);
    offlineOrInactive.forEach(u => {
        const status = u.payment_status === 'active' ? 'PAID' : 'FREE';
        console.log(`- ${u.name.padEnd(25)} [${status}]`);
    });
}

auditHimanshuTeam();
