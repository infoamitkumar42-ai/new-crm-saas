import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://vewqzsqddgmkslnuctvb.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDUzMDQ2MiwiZXhwIjoyMDgwMTA2NDYyfQ.pAgMGN6MtKm1A3fsKr1GIt8-qmKYhwFjSt92L_6_7us';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function fixDistribution() {
    console.log('\n🚒 --- RECLAIM & REDISTRIBUTE: THE BIG FIX ---\n');

    const now = new Date().toISOString();
    const startToday = new Date();
    startToday.setHours(0, 0, 0, 0);

    // 1. Identify "Bad" Users (Limit=0)
    // We strictly use Limit=0 as criteria for "Should not receive leads"
    const { data: badUsersRaw } = await supabase
        .from('users')
        .select('id')
        .eq('daily_limit', 0);

    const badUserIds = new Set(badUsersRaw.map(u => u.id));
    console.log(`Found ${badUserIds.size} users with Daily Limit = 0 (Targets for reclamation).`);

    // 2. Identify "Good" Users (Active: Limit > 0 & Valid > Now)
    const { data: goodUsers } = await supabase
        .from('users')
        .select('id, name, leads_today')
        .gt('daily_limit', 0)
        .gt('valid_until', now)
        .order('leads_today', { ascending: true }); // Prioritize those with 0

    if (!goodUsers || goodUsers.length === 0) {
        console.error("❌ No Eligible Paid Users found! Aborting.");
        return;
    }
    console.log(`Found ${goodUsers.length} Eligible Paid Users (Limit > 0 & Valid).`);
    console.log(`(First in line: ${goodUsers[0].name}, Leads: ${goodUsers[0].leads_today})`);

    // 3. Find Leads Assigned to Bad Users TODAY
    const { data: wastedLeads } = await supabase
        .from('leads')
        .select('id, name, phone, assigned_to')
        .gte('created_at', startToday.toISOString())
        .not('assigned_to', 'is', null);

    const leadsToMove = wastedLeads.filter(l => badUserIds.has(l.assigned_to));

    if (leadsToMove.length === 0) {
        console.log("✅ No wasted leads found to move.");
        return;
    }

    console.log(`\n🚨 Moving ${leadsToMove.length} Wasted Leads to ${goodUsers.length} Good Users...`);

    // 4. Distribution Loop
    let userIndex = 0;
    const leadsPerUser = {}; // Track for updating counters

    // Initialize counters for good users
    goodUsers.forEach(u => leadsPerUser[u.id] = (leadsPerUser[u.id] || u.leads_today));
    // Wait, we want to increment their current count.

    for (const lead of leadsToMove) {
        const targetUser = goodUsers[userIndex];

        // Re-assign in DB
        const { error } = await supabase
            .from('leads')
            .update({
                assigned_to: targetUser.id,
                user_id: targetUser.id,
                status: 'Assigned', // Reset status just in case
                assigned_at: new Date().toISOString()
            })
            .eq('id', lead.id);

        if (!error) {
            // Update local tracking
            leadsPerUser[targetUser.id] = (leadsPerUser[targetUser.id] || 0) + 1;

            // Move to next user
            userIndex = (userIndex + 1) % goodUsers.length;
        } else {
            console.error(`Failed to move lead ${lead.id}: ${error.message}`);
        }
        process.stdout.write('.');
    }

    console.log(`\n\n✅ Leads Re-distributed.`);

    // 5. Fix Counters
    // A. Reset Bad Users to 0 (or real count if any remaining? No, we took all from today)
    // Actually we only took "today's" leads.
    // Let's set their leads_today to 0 to be clean.
    console.log("Resetting counters for Bad Users...");
    for (const badId of badUserIds) {
        await supabase.from('users').update({ leads_today: 0 }).eq('id', badId);
    }

    // B. Update Good Users
    console.log("Updating counters for Good Users...");
    for (const u of goodUsers) {
        const newCount = leadsPerUser[u.id];
        if (newCount !== u.leads_today) {
            await supabase.from('users').update({ leads_today: newCount }).eq('id', u.id);
        }
    }

    console.log("\n🎉 FINAL FIX COMPLETE. Paid users should now have leads.");
}

fixDistribution();
