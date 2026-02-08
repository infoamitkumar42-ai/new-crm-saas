
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://vewqzsqddgmkslnuctvb.supabase.co';
const SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDUzMDQ2MiwiZXhwIjoyMDgwMTA2NDYyfQ.pAgMGN6MtKm1A3fsKr1GIt8-qmKYhwFjSt92L_6_7us";

const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

async function universalLeadFixer() {
    console.log("🚑 Universal Fixer for Stuck Leads...");

    // 1. Get Stuck Leads (TeamFire Context)
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const { data: leads, error } = await supabase
        .from('leads')
        .select('*')
        .eq('status', 'New') // Only stuck
        .gte('created_at', startOfDay.toISOString());

    if (error || leads.length === 0) {
        console.log("✅ No stuck leads found.");
        return;
    }

    console.log(`found ${leads.length} stuck leads.`);

    // 2. Get Eligible TeamFire Users
    const { data: users } = await supabase
        .from('users')
        .select('id, name, leads_today, daily_limit')
        .eq('team_code', 'TEAMFIRE')
        .eq('is_active', true)
        .gt('daily_limit', 0)
        .order('leads_today', { ascending: true }); // Give to those with 0 first

    if (!users || users.length === 0) {
        console.error("❌ No users available in TEAMFIRE");
        return;
    }

    // Filter out full users
    const availableUsers = users.filter(u => u.leads_today < u.daily_limit);
    console.log(`🎯 ${availableUsers.length} Users ready to receive leads.`);

    if (availableUsers.length === 0) return;

    let userIndex = 0;

    for (const lead of leads) {
        // Skip leads that look like they belong to Rajwinder/Chirag (Just in case)
        if (lead.source.toLowerCase().includes('raj') || lead.source.toLowerCase().includes('chirag')) {
            continue;
        }

        const targetUser = availableUsers[userIndex];

        // Update DB
        const { error: updateErr } = await supabase
            .from('leads')
            .update({
                status: 'Assigned',
                assigned_to: targetUser.id,
                user_id: targetUser.id
            })
            .eq('id', lead.id);

        if (!updateErr) {
            console.log(`✅ Assigned ${lead.name} -> ${targetUser.name}`);

            // Update local state for loop
            targetUser.leads_today++;

            // Check limits
            if (targetUser.leads_today >= targetUser.daily_limit) {
                availableUsers.splice(userIndex, 1); // Remove full user
                if (availableUsers.length === 0) break; // Stop if no one left
                userIndex = userIndex % availableUsers.length;
            } else {
                // Rotate
                userIndex = (userIndex + 1) % availableUsers.length;
            }
        }
    }

    // Sync counts to DB
    console.log("🔄 Syncing counters...");
    for (const u of users) {
        await supabase.from('users').update({ leads_today: u.leads_today }).eq('id', u.id);
    }

    console.log("🎉 All Done.");
}

universalLeadFixer();
