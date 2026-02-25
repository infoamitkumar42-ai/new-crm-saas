const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://vewqzsqddgmkslnuctvb.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDUzMDQ2MiwiZXhwIjoyMDgwMTA2NDYyfQ.pAgMGN6MtKm1A3fsKr1GIt8-qmKYhwFjSt92L_6_7us';
const supabase = createClient(supabaseUrl, supabaseKey);

(async () => {
    console.log(`--- 🚀 DISTRIBUTING ORPHANS TO WEEKLY BOOSTERS 🚀 ---`);

    // 1. Identify Eligible Weekly Boosters in GJ01TEAMFIRE
    const { data: users, error } = await supabase
        .from('users')
        .select('id, name, email, plan_name, role, leads_today, daily_limit, daily_limit_override')
        .eq('team_code', 'GJ01TEAMFIRE')
        .eq('is_active', true);

    if (error) { console.error(error); return; }

    const candidates = users.filter(u => {
        const plan = (u.plan_name || '').toLowerCase();
        const isWeeklyBoost = plan.includes('weekly_boost');
        const hitLimit = (u.leads_today >= (u.daily_limit_override || u.daily_limit));
        return isWeeklyBoost && !hitLimit;
    });

    console.log(`Found ${candidates.length} eligible Weekly Boosters:`);
    candidates.forEach(c => console.log(` - ${c.name} [${c.leads_today}/${c.daily_limit_override || c.daily_limit}]`));

    if (candidates.length === 0) {
        console.log("❌ No eligible Weekly Boosters found.");
        return;
    }

    // 2. Fetch Remaining Orphan Leads from Chirag
    const { data: orphans } = await supabase
        .from('leads')
        .select('id, name')
        .eq('status', 'Orphan')
        .ilike('source', '%Chirag%')
        .order('created_at', { ascending: true })
        .limit(50);

    if (!orphans || orphans.length === 0) {
        console.log("No orphans found to distribute.");
        return;
    }

    console.log(`Found ${orphans.length} remaining orphans.`);

    // 3. Distribute Round Robin
    let assignedCount = 0;

    for (let i = 0; i < orphans.length; i++) {
        const lead = orphans[i];

        // Re-check eligibility inside loop
        const eligibleNow = candidates.filter(u => u.leads_today < (u.daily_limit_override || u.daily_limit));
        if (eligibleNow.length === 0) {
            console.log("⛔ All candidates hit daily limit! Stopping.");
            break;
        }

        const user = eligibleNow[i % eligibleNow.length];

        console.log(`Assigning Lead ${i + 1}: ${lead.name} -> ${user.name}`);

        const { error: updateError } = await supabase
            .from('leads')
            .update({
                status: 'Assigned',
                assigned_to: user.id,
                user_id: user.id,
                assigned_at: new Date().toISOString(),
                notes: 'Manual Distribution (Weekly Boosters) - 2026-02-19'
            })
            .eq('id', lead.id);

        if (updateError) {
            console.error(`Failed to assign ${lead.id}:`, updateError.message);
        } else {
            assignedCount++;
            user.leads_today++; // Local increment

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
