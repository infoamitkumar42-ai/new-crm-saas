
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://vewqzsqddgmkslnuctvb.supabase.co';
const SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDUzMDQ2MiwiZXhwIjoyMDgwMTA2NDYyfQ.pAgMGN6MtKm1A3fsKr1GIt8-qmKYhwFjSt92L_6_7us";

const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

async function fixZapierLeads() {
    console.log("🚑 Fixing 97 Stuck Leads (Zapier/Old Source)...");

    // 1. Fetch Stuck Leads
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const { data: leads, error } = await supabase
        .from('leads')
        .select('*')
        .eq('status', 'New')
        .gte('created_at', startOfDay.toISOString());

    if (error || !leads.length) {
        console.log("No stuck leads found.");
        return;
    }

    console.log(`Found ${leads.length} stuck leads. Distributing...`);

    let teamFireCount = 0;
    let teamRajCount = 0;

    for (const lead of leads) {
        let targetTeam = '';
        let source = lead.source.toLowerCase();

        // 🕵️‍♂️ Infer Team from Source Name
        if (source.includes('rajwinder')) {
            targetTeam = 'TEAMRAJ';
        } else if (source.includes('cbo') || source.includes('fast') || source.includes('himanshu')) {
            targetTeam = 'TEAMFIRE';
        } else {
            console.log(`⚠️ Unknown Source: ${lead.source}. Skipping.`);
            continue;
        }

        // 🎯 Find Eligible User in that Team
        // We use a simple random/round-robin fetch based on availability
        const { data: users } = await supabase
            .from('users')
            .select('id, name, leads_today, daily_limit')
            .eq('team_code', targetTeam)
            .eq('is_active', true)
            .eq('is_online', true)
            .lt('leads_today', 100) // Safety cap, better logic in loop
            .order('leads_today', { ascending: true }) // Give to free user
            .limit(5);

        if (!users || users.length === 0) {
            console.log(`⚠️ No users available in ${targetTeam} for lead ${lead.name}`);
            continue;
        }

        // Pick the first available one (Atomic later)
        let chosenUser = null;
        for (const u of users) {
            if (u.leads_today < u.daily_limit) {
                chosenUser = u;
                break;
            }
        }

        if (chosenUser) {
            // Assign
            const { error: updateErr } = await supabase
                .from('leads')
                .update({
                    status: 'Assigned',
                    assigned_to: chosenUser.id,
                    user_id: chosenUser.id
                })
                .eq('id', lead.id);

            if (!updateErr) {
                // Increment Count Manually (For this script)
                await supabase.from('users').update({ leads_today: chosenUser.leads_today + 1 }).eq('id', chosenUser.id);

                console.log(`✅ Assigned ${lead.name} -> ${chosenUser.name} (${targetTeam})`);
                if (targetTeam === 'TEAMFIRE') teamFireCount++;
                if (targetTeam === 'TEAMRAJ') teamRajCount++;
            }
        }
    }

    console.log(`\n🎉 DONE! Assigned: Fire=${teamFireCount}, Raj=${teamRajCount}`);
}

fixZapierLeads();
