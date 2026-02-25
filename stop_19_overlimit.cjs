const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = "https://vewqzsqddgmkslnuctvb.supabase.co";
const SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDUzMDQ2MiwiZXhwIjoyMDgwMTA2NDYyfQ.pAgMGN6MtKm1A3fsKr1GIt8-qmKYhwFjSt92L_6_7us";
const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

// These 19 users are quota-full but still active (Himanshu Sharma excluded per user request)
const usersToStop = [
    'Babita',
    'Gurpreet kaur',
    'Husanpreet kaur',
    'Jashandeep kaur',
    'Jashandeep Kaur',
    'Kiran Brar',
    'Lakhveer kaur',
    'MOHIT LUDHRANI',
    'Navpreet kaur',
    'Pooja jolly',
    'Princy',
    'Rahul',
    'Rajinder',
    'Rajni',
    'Ravenjeet Kaur',
    'Rohit Kumar',
    'Saijel Goel',
    'Shivani',
    'Tushte',
    'VEERPAL KAUR'
];

async function main() {
    console.log("🛑 Stopping 19 Over-Limit Users (Himanshu excluded)...\n");

    // Fetch these users from TEAMFIRE to get their IDs
    const { data: users, error } = await supabase
        .from('users')
        .select('id, name, email, is_active')
        .eq('team_code', 'TEAMFIRE')
        .eq('is_active', true)
        .in('name', usersToStop);

    if (error) { console.error("Error:", error.message); return; }

    console.log(`Found ${users.length} matching active users to stop.\n`);

    let stoppedCount = 0;
    for (let u of users) {
        // Double check - skip Himanshu
        if (u.name === 'Himanshu Sharma') {
            console.log(`⏭️ SKIPPING: ${u.name} (${u.email}) - Kept Active per request.`);
            continue;
        }

        const { error: updErr } = await supabase
            .from('users')
            .update({ is_active: false })
            .eq('id', u.id);

        if (updErr) {
            console.error(`❌ Error stopping ${u.name}: ${updErr.message}`);
        } else {
            stoppedCount++;
            console.log(`✅ Stopped: ${u.name} (${u.email})`);
        }
    }

    console.log(`\n🎉 Done! ${stoppedCount} users have been set to Inactive.`);
}

main().catch(console.error);
