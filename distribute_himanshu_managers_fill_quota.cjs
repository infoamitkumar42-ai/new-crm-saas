const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://vewqzsqddgmkslnuctvb.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDUzMDQ2MiwiZXhwIjoyMDgwMTA2NDYyfQ.pAgMGN6MtKm1A3fsKr1GIt8-qmKYhwFjSt92L_6_7us';
const supabase = createClient(supabaseUrl, supabaseKey);

(async () => {
    console.log(`--- 🈵 FILLING MANAGER/SUPERVISOR QUOTAS (Himanshu Team) 🈵 ---`);

    // 1. Fetch Active Users (Managers/Supervisors only)
    const { data: users, error } = await supabase
        .from('users')
        .select('id, name, plan_name, role, leads_today, daily_limit, daily_limit_override, total_leads_promised, total_leads_received')
        .eq('team_code', 'TEAMFIRE')
        .eq('is_active', true);

    if (error) { console.error(error); return; }

    // Filter Targets
    const targets = users.filter(u => {
        const plan = (u.plan_name || '').toLowerCase();
        return plan.includes('manager') || plan.includes('supervisor');
    });

    console.log(`Found ${targets.length} Managers/Supervisors.`);

    // Calculate Remaining Daily Capacity
    const capable = [];
    let totalCapacity = 0;

    targets.forEach(u => {
        const limit = u.daily_limit_override || u.daily_limit || 0;
        const quota = u.total_leads_promised || 0;
        const received = u.total_leads_received || 0;

        const remainingDaily = Math.max(0, limit - u.leads_today);
        const remainingQuota = Math.max(0, quota - received);
        const canTake = Math.min(remainingDaily, remainingQuota);

        if (canTake > 0) {
            capable.push({ ...u, canTake });
            totalCapacity += canTake;
        }
    });

    // Sort by Plan (Manager first) then Capacity
    capable.sort((a, b) => {
        const aMgr = a.plan_name.toLowerCase().includes('manager');
        const bMgr = b.plan_name.toLowerCase().includes('manager');
        if (aMgr && !bMgr) return -1;
        if (!aMgr && bMgr) return 1;
        return b.canTake - a.canTake;
    });

    console.log(`Total Capacity Available: ${totalCapacity}`);
    capable.forEach(c => console.log(` - ${c.name} (${c.plan_name}): Can take +${c.canTake}`));

    if (totalCapacity === 0) {
        console.log("❌ No remaining capacity in Managers/Supervisors.");
        return;
    }

    // 2. Fetch ALL Himanshu Orphans
    // Source: Digital Skills India / Himanshu Sharma
    const START_TIME_ISO = '2026-02-18T18:30:00.000Z'; // Today

    const { data: orphans } = await supabase
        .from('leads')
        .select('id, name')
        .eq('status', 'Orphan')
        .or('source.ilike.%Himanshu%,source.ilike.%Digital Skills%')
        .gte('created_at', START_TIME_ISO)
        .order('created_at', { ascending: true }) // FIFO
        .limit(totalCapacity + 50); // Fetch enough to fill

    if (!orphans || orphans.length === 0) {
        console.log("No orphans found to distribute.");
        return;
    }

    console.log(`Found ${orphans.length} orphans to distribute.`);

    // 3. Fill Quotas One by One (Smart Distribution)
    // We want to fill quotas, but also be somewhat fair?
    // User said "inka quota pura kardo".
    // Strategy: Round Robin until individual limits hit.

    let assignedCount = 0;

    for (let i = 0; i < orphans.length; i++) {
        const lead = orphans[i];

        // Find next eligible user
        // We re-filter inside loop or maintain a pointer?
        // Round Robin is safest to distribute evenly until full.
        const eligibleNow = capable.filter(u => u.canTake > 0);

        if (eligibleNow.length === 0) {
            console.log("⛔ All Manager/Supervisor limits reached! Stopping.");
            break;
        }

        const user = eligibleNow[assignedCount % eligibleNow.length]; // Simple Rotation

        console.log(`Assigning Lead ${i + 1}: ${lead.name} -> ${user.name}`);

        const { error: updateError } = await supabase
            .from('leads')
            .update({
                status: 'Assigned',
                assigned_to: user.id,
                user_id: user.id,
                assigned_at: new Date().toISOString(),
                notes: 'Manual Fill (Himanshu Managers) - 2026-02-19'
            })
            .eq('id', lead.id);

        if (updateError) {
            console.error(`Failed to assign ${lead.id}:`, updateError.message);
        } else {
            assignedCount++;
            user.canTake--; // Decrease local capacity tracking
            user.leads_today++; // Just for logic

            // DB Update
            const { error: rpcError } = await supabase.rpc('increment_leads_today_safe', { user_id: user.id });
            if (rpcError) {
                // Fallback manual
                const { data: u } = await supabase.from('users').select('leads_today, total_leads_received').eq('id', user.id).single();
                if (u) {
                    await supabase.from('users').update({
                        leads_today: (u.leads_today || 0) + 1,
                        total_leads_received: (u.total_leads_received || 0) + 1
                    }).eq('id', user.id);
                }
            }
        }
    }

    console.log(`\n✅ OPERATION COMPLETE. Distributed ${assignedCount} leads.`);

})();
