import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://vewqzsqddgmkslnuctvb.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDUzMDQ2MiwiZXhwIjoyMDgwMTA2NDYyfQ.pAgMGN6MtKm1A3fsKr1GIt8-qmKYhwFjSt92L_6_7us';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function recalcCounts() {
    console.log('\n🔄 --- SYNCING USER COUNTERS (DB FIX) ---');

    // 1. Get assignments for TODAY
    const startToday = new Date();
    startToday.setHours(0, 0, 0, 0);
    const timeString = startToday.toISOString();

    console.log(`Counting actual leads since: ${timeString}`);

    const { data: assignments, error } = await supabase
        .from('leads')
        .select('assigned_to')
        .gte('created_at', timeString)
        .not('assigned_to', 'is', null);

    if (error) {
        console.error("Error fetching leads:", error.message);
        return;
    }

    // 2. Count per user
    const actualCounts = {};
    assignments.forEach(a => {
        actualCounts[a.assigned_to] = (actualCounts[a.assigned_to] || 0) + 1;
    });

    console.log(`Found assignments for ${Object.keys(actualCounts).length} unique users.`);

    // 3. Update Users Table
    // We need to fetch ALL users to ensure we set 0 for those who have 0 (optional, but good for cleanup)
    // Or just update those we found. Let's update those we found first to fix the "0 lead" complaint.

    let updatedCount = 0;

    for (const userId of Object.keys(actualCounts)) {
        const trueCount = actualCounts[userId];

        // Update DB
        const { error: updateError } = await supabase
            .from('users')
            .update({ leads_today: trueCount })
            .eq('id', userId);

        if (updateError) {
            console.error(`❌ Failed to update user ${userId}:`, updateError.message);
        } else {
            // console.log(`✅ User ${userId} updated to ${trueCount}`);
            process.stdout.write('.'); // Compact output
            updatedCount++;
        }
    }

    console.log(`\n\n✅ SYNC COMPLETE: Updated 'leads_today' for ${updatedCount} users.`);

    // 4. Verify Swati & Simran specifically
    const namesToCheck = ['Swati', 'Simran'];
    console.log("\n🧪 Verification Check:");

    for (const nameDetail of namesToCheck) {
        const { data: u } = await supabase
            .from('users')
            .select('name, leads_today')
            .ilike('name', `%${nameDetail}%`);

        if (u) {
            u.forEach(user => {
                console.log(`- ${user.name}: Count is now ${user.leads_today}`);
            });
        }
    }
}

recalcCounts();
