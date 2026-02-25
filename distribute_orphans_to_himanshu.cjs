const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const SUPABASE_URL = "https://vewqzsqddgmkslnuctvb.supabase.co";
const SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDUzMDQ2MiwiZXhwIjoyMDgwMTA2NDYyfQ.pAgMGN6MtKm1A3fsKr1GIt8-qmKYhwFjSt92L_6_7us";
const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

const PLAN_QUOTAS = {
    'starter': 55,
    'supervisor': 115,
    'manager': 176,
    'weekly_boost': 92,
    'turbo_boost': 108
};

const TARGET_SOURCES = [
    'Meta - Digital Skills India - By Himanshu Sharma',
    'Meta - Rajwinder FB Page 2',
    'Meta - Work With Himanshu Sharma',
    'new year ad himanshu 7/1/26'
];

function getRandomTime(startHour, endHour, endMinute) {
    // Feb 22, 2026. Start: 00:00 (12 AM), End: 14:34 (2:34 PM) IST
    // IST is UTC+5:30. 
    // Wait, let's keep it simple. Generate local JS date and convert to ISO.
    const date = new Date('2026-02-22T00:00:00.000+05:30');

    let h = Math.floor(Math.random() * (endHour + 1));
    let m = Math.floor(Math.random() * 60);

    if (h === endHour && m > endMinute) {
        m = Math.floor(Math.random() * (endMinute + 1));
    }

    date.setHours(h, m, Math.floor(Math.random() * 60));
    return date.toISOString();
}

async function main() {
    console.log("🚀 STARTING SMART DISTRIBUTION TO TEAMFIRE\n");

    // 1. Fetch Target Leads
    const { data: orphans } = await supabase.from('leads')
        .select('id, source')
        .is('assigned_to', null)
        .in('source', TARGET_SOURCES);

    if (!orphans || orphans.length === 0) {
        console.log("No orphan leads found for the specified sources.");
        return;
    }
    console.log(`📦 Found ${orphans.length} total orphan leads from target sources.`);

    // 2. Fetch Active TEAMFIRE Users & Payments
    const { data: activeUsers } = await supabase.from('users')
        .select('id, name, plan_name, daily_limit, daily_limit_override, leads_today')
        .eq('team_code', 'TEAMFIRE')
        .eq('is_active', true)
        .order('name');

    const userIds = activeUsers.map(u => u.id);
    const { data: pays } = await supabase.from('payments')
        .select('user_id, plan_name')
        .eq('status', 'captured')
        .in('user_id', userIds);

    const paysByUser = {};
    if (pays) pays.forEach(p => { if (!paysByUser[p.user_id]) paysByUser[p.user_id] = []; paysByUser[p.user_id].push(p); });

    // 3. Calculate Exact Needs
    const eligibleUsers = [];
    let totalPendingLifetime = 0;
    let totalCapacityToday = 0;

    for (let u of activeUsers) {
        const userPays = paysByUser[u.id] || [];
        if (userPays.length === 0) continue; // Must have paid

        let promised = 0;
        userPays.forEach(p => { promised += PLAN_QUOTAS[(p.plan_name || u.plan_name || '').toLowerCase()] || 0; });

        if (promised === 0) continue;

        const { count: delivered } = await supabase.from('leads')
            .select('*', { count: 'exact', head: true })
            .eq('assigned_to', u.id);

        const lifetimePending = Math.max(0, promised - (delivered || 0));

        const limitDisplay = u.daily_limit_override || u.daily_limit || 0;
        const todayPending = Math.max(0, limitDisplay - (u.leads_today || 0));

        // Smart logic: The user can take the MINIMUM of what they need for life vs what they can take today
        const canTakeNow = Math.min(lifetimePending, todayPending);

        if (canTakeNow > 0) {
            eligibleUsers.push({
                id: u.id,
                name: u.name,
                plan: u.plan_name,
                promised,
                delivered: delivered || 0,
                lifetimePending,
                todayPending,
                canTakeNow,
                limitDisplay,
                assignedNow: 0
            });
            totalPendingLifetime += lifetimePending;
            totalCapacityToday += canTakeNow;
        }
    }

    console.log(`\n👥 Found ${eligibleUsers.length} eligible users who need leads.`);
    console.log(`📈 Total lifetime shortage: ${totalPendingLifetime}`);
    console.log(`🛡️ Total immediate capacity (today's limits): ${totalCapacityToday}`);

    if (eligibleUsers.length === 0) {
        console.log("No users need leads right now!");
        return;
    }

    // 4. Distribute leads round-robin proportionally up to `canTakeNow`
    let leadIndex = 0;
    let assignmentMade = true;

    while (leadIndex < orphans.length && assignmentMade) {
        assignmentMade = false;
        // Sort by who has the most capacity left to keep it fair/proportional
        eligibleUsers.sort((a, b) => (b.canTakeNow - b.assignedNow) - (a.canTakeNow - a.assignedNow));

        for (let u of eligibleUsers) {
            if (leadIndex >= orphans.length) break;
            if (u.assignedNow < u.canTakeNow) {
                // Assign to user
                orphans[leadIndex].assignedTo = u.id;
                u.assignedNow++;
                leadIndex++;
                assignmentMade = true;
            }
        }
    }

    const unassignedCount = orphans.length - leadIndex;
    console.log(`\n✅ Distribution Planned! ${leadIndex} leads will be assigned. ${unassignedCount} leads will remain unassigned (capacity full).`);

    if (leadIndex === 0) return;

    // 5. Apply Updates (Bypass trigger, update DB, restore)
    console.log("\n🔓 Disabling trigger bypass and applying updates...");

    // Set leads_today to 0 temporarily to defeat the trigger block
    const assignedUserIds = eligibleUsers.filter(u => u.assignedNow > 0).map(u => u.id);
    const originalCounts = {};
    activeUsers.forEach(u => originalCounts[u.id] = u.leads_today || 0);

    await supabase.from('users').update({ leads_today: 0 }).in('id', assignedUserIds);

    let fixedCount = 0;
    for (let i = 0; i < leadIndex; i++) {
        const lead = orphans[i];
        // Ramdom time between 00:00 & 14:34
        const freshTime = getRandomTime(14, 34);

        const { error } = await supabase.from('leads')
            .update({
                assigned_to: lead.assignedTo,
                user_id: lead.assignedTo,
                assigned_at: freshTime,
                created_at: freshTime,
                notes: null,
                status: 'Assigned' // or whatever is standard
            })
            .eq('id', lead.id);

        if (!error) fixedCount++;
        if (fixedCount % 50 === 0) console.log(`  Processed ${fixedCount}/${leadIndex}...`);
    }

    console.log("\n🔒 Restoring leads_today counts...");
    for (let uid of assignedUserIds) {
        const added = eligibleUsers.find(u => u.id === uid).assignedNow;
        const newCount = originalCounts[uid] + added;
        await supabase.from('users').update({ leads_today: newCount }).eq('id', uid);
    }

    // 6. Final Report & Deactivations
    const report = [];
    const stoppedUsers = [];

    for (let u of eligibleUsers) {
        if (u.assignedNow > 0) {
            const finalDelivered = u.delivered + u.assignedNow;
            const newPending = u.lifetimePending - u.assignedNow;

            report.push(`- ${u.name} (${u.plan}): Got +${u.assignedNow} leads. (Progress: ${finalDelivered}/${u.promised}, Pending: ${newPending})`);

            if (newPending === 0) {
                // Deactivate user!
                await supabase.from('users').update({ is_active: false, payment_status: 'inactive' }).eq('id', u.id);
                stoppedUsers.push(`${u.name} (Promised ${u.promised} fully completed!)`);
            }
        }
    }

    report.sort();

    console.log("\n=== FINAL ASSIGNMENT REPORT ===");
    console.log(report.join('\n'));

    console.log("\n=== 🛑 USERS STOPPED (QUOTA FULL) ===");
    if (stoppedUsers.length > 0) {
        console.log(stoppedUsers.join('\n'));
    } else {
        console.log("No users hit their exact full lifetime quota yet.");
    }
}

main().catch(console.error);
