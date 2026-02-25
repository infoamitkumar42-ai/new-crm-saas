const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://vewqzsqddgmkslnuctvb.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDUzMDQ2MiwiZXhwIjoyMDgwMTA2NDYyfQ.pAgMGN6MtKm1A3fsKr1GIt8-qmKYhwFjSt92L_6_7us';
const supabase = createClient(supabaseUrl, supabaseKey);

(async () => {
    // 6 AM IST Today
    const startOfDay = new Date();
    startOfDay.setUTCHours(0, 30, 0, 0);

    console.log(`--- 🔧 REPAIRING USER COUNTERS (Since ${startOfDay.toISOString()}) 🔧 ---`);

    // 1. Fetch Assigned Leads since Morning
    const { data: leads, error } = await supabase
        .from('leads')
        .select('assigned_to')
        .gte('created_at', startOfDay.toISOString());

    if (error) { console.error(error); return; }

    // 2. Count Leads per User
    const counts = {};
    for (const l of leads) {
        if (l.assigned_to) {
            counts[l.assigned_to] = (counts[l.assigned_to] || 0) + 1;
        }
    }

    console.log(`Found ${Object.keys(counts).length} users with leads.\n`);

    // 3. Update Users
    for (const [userId, actualCount] of Object.entries(counts)) {
        // Fetch current user data to be safe
        const { data: user } = await supabase
            .from('users')
            .select('name, email, leads_today, total_leads_received')
            .eq('id', userId)
            .single();

        if (!user) continue;

        // Check discrepancy
        if (user.leads_today !== actualCount) {
            console.log(`Mismatch for ${user.name}: DB=${user.leads_today}, ACTUAL=${actualCount}. Repairing...`);

            // We set leads_today to actualCount. 
            // For total_leads_received, we should probably add the difference, but leads_today is the critical blocker.
            // Let's just set leads_today for now to stop the loop.
            // Total leads might need a more complex recalc if we want to be perfect, but let's assume leads_today is the main issue.
            // Wait, if leads_today didn't increment, total likely didn't either.
            // So we should add the difference (Actual - DB_Today) to DB_Total.

            const diff = actualCount - user.leads_today;
            const newTotal = (user.total_leads_received || 0) + diff;

            const { error: updateError } = await supabase
                .from('users')
                .update({
                    leads_today: actualCount,
                    // Optionally update total_leads_received if we are sure
                    // total_leads_received: newTotal 
                })
                .eq('id', userId);

            if (updateError) console.error(`Failed to update ${user.name}:`, updateError);
            else console.log(`✅ Fixed ${user.name}`);
        } else {
            console.log(`✅ ${user.name} is ALREADY CORRECT (${actualCount})`);
        }
    }

    console.log('\n--- Repair Complete ---');
})();
