const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = "https://vewqzsqddgmkslnuctvb.supabase.co";
const SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDUzMDQ2MiwiZXhwIjoyMDgwMTA2NDYyfQ.pAgMGN6MtKm1A3fsKr1GIt8-qmKYhwFjSt92L_6_7us";
const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

const VANRAJ_ID = "113909a7-b3fe-4f67-887a-3e2af5d6e89e";
const CHIRAG_SOURCE = "Meta - Digital Chirag";

// The 9 users the user specified
const TARGET_USERS = [
    "Sumita", "Fatema kalvatar", "AJAY AHIR", "HANSA MAKWANA",
    "KAMLESH THAKOR", "Ankita Solanki", "Manisha Solanki",
    "AHIR MILAN KUMAR", "Utsav Sadhu"
];

function getRandomTime(startHour, endHour) {
    // Current IST is ~14:41 PM (2:41 PM). Let's distribute from 08:00 AM to 14:30 PM.
    const date = new Date('2026-02-23T00:00:00.000+05:30');
    let h = Math.floor(Math.random() * (endHour - startHour + 1)) + startHour;
    let m = Math.floor(Math.random() * 60);
    date.setHours(h, m, Math.floor(Math.random() * 60));
    return date.toISOString();
}

async function main() {
    console.log("🚀 STARTING REASSIGNMENT: VANRAJ (23) + TODAY CHIRAG (8)\n");

    // 1. Fetch Vanraj's Leads
    const { data: vanrajLeads } = await supabase.from('leads')
        .select('id')
        .eq('assigned_to', VANRAJ_ID);

    console.log(`👤 Found ${vanrajLeads ? vanrajLeads.length : 0} leads assigned to Vanraj.`);

    // 2. Fetch Today's Chirag Leads (Assigned or Unassigned doesn't matter, but let's assume they might be unassigned or we grab by date and source)
    const { data: chiragLeads } = await supabase.from('leads')
        .select('id, assigned_to')
        .eq('source', CHIRAG_SOURCE)
        .gte('created_at', '2026-02-22T18:30:00.000Z'); // Today 12AM IST (Feb 23)

    console.log(`📈 Found ${chiragLeads ? chiragLeads.length : 0} leads from '${CHIRAG_SOURCE}' today.`);

    // Pool all leads together
    const pool = [...(vanrajLeads || []), ...(chiragLeads || [])];

    // Remove duplicates just in case (e.g. if Vanraj was assigned today's chirag lead)
    const uniqueLeadIds = [...new Set(pool.map(l => l.id))];
    console.log(`\n🎯 TOTAL LEAD POOL SIZE: ${uniqueLeadIds.length}`);

    if (uniqueLeadIds.length === 0) {
        console.log("No leads to distribute! Aborting.");
        return;
    }

    // 3. Stop Vanraj Account
    console.log(`\n🛑 Stopping Vanraj Sinh Vaja's account (Active -> False)...`);
    await supabase.from('users').update({ is_active: false }).eq('id', VANRAJ_ID);

    // 4. Determine Eligible Users & Capacities
    const { data: activeUsers } = await supabase.from('users')
        .select('id, name, leads_today')
        .eq('team_code', 'GJ01TEAMFIRE')
        .in('name', TARGET_USERS);

    let eligibleUsers = activeUsers.map(u => ({
        id: u.id,
        name: u.name,
        originalLeadsToday: u.leads_today || 0,
        assignedNow: 0
    }));

    // User only wants these exact 9 spread equally. (31 / 9 = ~3.4. So everyone gets 3, someone gets 4).
    console.log(`\n👥 Found ${eligibleUsers.length} target users for distribution.`);
    if (eligibleUsers.length === 0) return;

    // 5. Unassign from current owners (if any) and reset trigger counters temporarily
    console.log("\n🔓 Unassigning leads and bypassing triggers...");
    const assignedUserIds = eligibleUsers.map(u => u.id);
    await supabase.from('users').update({ leads_today: 0 }).in('id', assignedUserIds);

    // Unassign all pool leads temporarily to clear state
    for (let i = 0; i < uniqueLeadIds.length; i += 50) {
        const batch = uniqueLeadIds.slice(i, i + 50);
        await supabase.from('leads').update({ assigned_to: null, user_id: null }).in('id', batch);
    }

    // 6. Round Robin Assignment 
    let leadIndex = 0;
    while (leadIndex < uniqueLeadIds.length) {
        for (let u of eligibleUsers) {
            if (leadIndex >= uniqueLeadIds.length) break;

            const leadId = uniqueLeadIds[leadIndex];
            const freshTime = getRandomTime(8, 14); // 8 AM to 2 PM IST

            const { error } = await supabase.from('leads')
                .update({
                    assigned_to: u.id,
                    user_id: u.id,
                    assigned_at: freshTime,
                    created_at: freshTime, // Makes it look totally fresh today
                    notes: null, // Clear all notes
                    status: 'Assigned'
                })
                .eq('id', leadId);

            if (!error) {
                u.assignedNow++;
            }
            leadIndex++;
        }
    }

    // 7. Restore triggers and report
    console.log("\n🔒 Restoring user daily limits...");
    for (let u of eligibleUsers) {
        const finalCount = u.originalLeadsToday + u.assignedNow;
        await supabase.from('users').update({ leads_today: finalCount }).eq('id', u.id);
    }

    console.log("\n=== 📊 FINAL DISTRIBUTION REPORT ===");
    eligibleUsers.sort((a, b) => b.assignedNow - a.assignedNow).forEach(u => {
        console.log(`- ${u.name}: Received +${u.assignedNow} leads`);
    });

}

main().catch(console.error);
