const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = "https://vewqzsqddgmkslnuctvb.supabase.co";
const SUPABASE_SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDUzMDQ2MiwiZXhwIjoyMDgwMTA2NDYyfQ.pAgMGN6MtKm1A3fsKr1GIt8-qmKYhwFjSt92L_6_7us";

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function undoRedistribution() {
    console.log("⏪ Starting Undo Redistribution (Dynamic ID Fetch)...");

    const specialistEmails = [
        'ludhranimohit91@gmail.com', 'dineshmonga22@gmail.com', 'dhawantanu536@gmail.com',
        'harmandeepkaurmanes790@gmail.com', 'payalpuri3299@gmail.com', 'vansh.rajni.96@gmail.com',
        'rupanasameer551@gmail.com', 'loveleenkaur8285@gmail.com', 'rohitgagneja69@gmail.com',
        'rasganiya98775@gmail.com', 'jerryvibes.444@gmail.com', 'brark5763@gmail.com',
        'sharmahimanshu9797@gmail.com', 'rrai26597@gmail.com', 'samandeepkaur1216@gmail.com',
        'dbrar8826@gmail.com', 'nehagoyal36526@gmail.com', 'rahulkumarrk1111@gmail.com'
    ];

    const startOfDay = new Date();
    startOfDay.setUTCHours(0, 0, 0, 0);

    // 1. Fetch Specialists IDs
    const { data: specialistsData } = await supabase.from('users').select('id').in('email', specialistEmails);
    const specialistIds = specialistsData.map(s => s.id);
    console.log(`👤 Found ${specialistIds.length} specialist IDs.`);

    // 2. Find Victims
    const { data: users } = await supabase.from('users').select('id, name, email, leads_today');
    const { data: currentLeads } = await supabase.from('leads').select('assigned_to').gte('created_at', startOfDay.toISOString());

    const victims = [];
    users.forEach(u => {
        const count = currentLeads.filter(l => l.assigned_to === u.id).length;
        if (u.leads_today > count) {
            victims.push({ id: u.id, name: u.name, loss: u.leads_today - count });
        }
    });

    const totalLoss = victims.reduce((a, b) => a + b.loss, 0);
    console.log(`🔍 Found ${victims.length} victims who lost a total of ${totalLoss} leads.`);

    if (totalLoss === 0) {
        console.log("✅ No victims found. Counters already match lead counts.");
        return;
    }

    // 3. Find candidate leads (assigned to specialists today)
    const { data: candidateLeads } = await supabase.from('leads')
        .select('id, name, phone, assigned_to')
        .in('assigned_to', specialistIds)
        .gte('created_at', startOfDay.toISOString());

    if (!candidateLeads) {
        console.log("❌ No leads found with specialists today.");
        return;
    }

    console.log(`📦 Specialists currently hold ${candidateLeads.length} leads from today.`);

    let restoredCount = 0;
    let victimIndex = 0;

    for (const lead of candidateLeads) {
        if (victimIndex >= victims.length) break;

        const victim = victims[victimIndex];

        console.log(`🔄 Reassigning [${lead.phone}] ${lead.name} BACK to ${victim.name}`);

        // Reassign
        const { error: updErr } = await supabase
            .from('leads')
            .update({
                assigned_to: victim.id,
                user_id: victim.id,
                notes: `Restored assignment (reverted redistribution)`
            })
            .eq('id', lead.id);

        if (!updErr) {
            restoredCount++;
            victim.loss--;
            if (victim.loss <= 0) {
                victimIndex++;
            }
        } else {
            console.error(`❌ Error restoring lead ${lead.id}:`, updErr.message);
        }

        if (restoredCount >= totalLoss) break;
    }

    console.log(`\n🎉 SUCCESS! RESTORED ${restoredCount} leads to their original teams!`);
}

undoRedistribution();
