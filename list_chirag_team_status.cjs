const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = "https://vewqzsqddgmkslnuctvb.supabase.co";
const SUPABASE_SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDUzMDQ2MiwiZXhwIjoyMDgwMTA2NDYyfQ.pAgMGN6MtKm1A3fsKr1GIt8-qmKYhwFjSt92L_6_7us";

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function listChiragTeam() {
    const managerIds = [
        '8c653bc9-eb28-45d7-b658-4b3694956171',
        '460e0444-25a8-4ac9-9260-ce21be97aab3',
        'aac2b76b-0794-49e2-a030-91711ab5ecff',
        'c4c71cbb-6000-4137-b72f-2c07be2179e7',
        'a98f9160-17e8-4eac-904c-0518705fa67c'
    ];

    console.log(`🔍 Listing Team Status for Chirag (All potential manager IDs)...`);

    const { data: users, error } = await supabase
        .from('users')
        .select('name, email, is_online, is_active, payment_status, valid_until, manager_id')
        .in('manager_id', managerIds)
        .order('manager_id', { ascending: true });

    if (error) {
        console.error("❌ Error:", error.message);
        return;
    }

    console.log("\nStatus | Active | Name                      | Email");
    console.log("-------|--------|---------------------------|-------------------------");

    users.forEach(u => {
        const status = u.is_online ? "ONLINE" : "OFFLINE";
        const active = u.is_active ? "YES" : "NO ";
        console.log(`${status.padEnd(6)} | ${active}    | ${u.name.padEnd(25)} | ${u.email}`);
    });

    console.log(`\n📊 Total Members: ${users.length}`);
    const offlineCount = users.filter(u => !u.is_online && u.is_active).length;
    console.log(`⚠️ Offline & Active: ${offlineCount}`);
}

listChiragTeam();
