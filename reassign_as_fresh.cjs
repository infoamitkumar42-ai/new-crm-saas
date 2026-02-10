const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = "https://vewqzsqddgmkslnuctvb.supabase.co";
const SUPABASE_SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDUzMDQ2MiwiZXhwIjoyMDgwMTA2NDYyfQ.pAgMGN6MtKm1A3fsKr1GIt8-qmKYhwFjSt92L_6_7us";

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function reassignAsFresh() {
    console.log("🔄 Reassigning Leads as 'Fresh' (Bypassing Trigger)...");

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

    // 1. Fetch Specialist IDs
    const { data: specData } = await supabase.from('users').select('id').in('email', specialistEmails);
    const specialistIds = specData.map(s => s.id);

    // 2. Fetch Victims (Compare users.leads_today vs table count)
    const { data: users } = await supabase.from('users').select('id, name, email, leads_today');
    const { data: currentLeads } = await supabase.from('leads').select('assigned_to').gte('created_at', startOfDay.toISOString());

    const victimsList = [];
    users.forEach(u => {
        const count = currentLeads.filter(l => l.assigned_to === u.id).length;
        if (u.leads_today > count) {
            victimsList.push({ id: u.id, name: u.name, loss: u.leads_today - count });
        }
    });

    const totalToRestore = victimsList.reduce((a, b) => a + b.loss, 0);
    console.log(`🔍 Found ${victimsList.length} victims who lost ${totalToRestore} leads.`);

    if (totalToRestore === 0) {
        console.log("✅ Nothing to restore.");
        return;
    }

    // 3. Find candidate leads from specialists today
    const { data: candidateLeads } = await supabase.from('leads')
        .select('id, name, phone, assigned_to')
        .in('assigned_to', specialistIds)
        .gte('created_at', startOfDay.toISOString());

    let restoredCount = 0;
    let victimIndex = 0;
    for (const lead of (candidateLeads || [])) {
        if (victimIndex >= victimsList.length) break;
        const victim = victimsList[victimIndex];

        console.log(`🔄 Reassigning [${restoredCount + 1}/${totalToRestore}] ${lead.phone} BACK to ${victim.name} as FRESH`);

        // Reassign with Fresh status to bypass trigger
        const { error: updErr } = await supabase.from('leads').update({
            assigned_to: victim.id,
            user_id: victim.id,
            status: 'Fresh',
            notes: `Restored Assignment (Manual Revert)`
        }).eq('id', lead.id);

        if (!updErr) {
            restoredCount++;
            victim.loss--;
            if (victim.loss <= 0) victimIndex++;
        } else {
            console.error(`❌ Error restoring lead ${lead.id}:`, updErr.message);
        }

        if (restoredCount >= totalToRestore) break;
    }

    console.log(`\n🎉 SUCCESS! Restored ${restoredCount} leads to the original users!`);
}

reassignAsFresh();
