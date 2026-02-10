const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = "https://vewqzsqddgmkslnuctvb.supabase.co";
const SUPABASE_SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDUzMDQ2MiwiZXhwIjoyMDgwMTA2NDYyfQ.pAgMGN6MtKm1A3fsKr1GIt8-qmKYhwFjSt92L_6_7us";

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function performRevert() {
    console.log("🛠️ Starting TARGETED Revert with Snapshot...");

    try {
        // 1. Snapshot all daily_limits
        const { data: snapshot, error: snapErr } = await supabase.from('users').select('id, email, daily_limit');
        if (snapErr) throw new Error(`Snapshot fetch failed: ${snapErr.message}`);
        console.log(`📸 Snapshotted ${snapshot.length} users.`);

        // 2. Identify Specialists
        const specialistEmails = [
            'ludhranimohit91@gmail.com', 'dineshmonga22@gmail.com', 'dhawantanu536@gmail.com',
            'harmandeepkaurmanes790@gmail.com', 'payalpuri3299@gmail.com', 'vansh.rajni.96@gmail.com',
            'rupanasameer551@gmail.com', 'loveleenkaur8285@gmail.com', 'rohitgagneja69@gmail.com',
            'rasganiya98775@gmail.com', 'jerryvibes.444@gmail.com', 'brark5763@gmail.com',
            'sharmahimanshu9797@gmail.com', 'rrai26597@gmail.com', 'samandeepkaur1216@gmail.com',
            'dbrar8826@gmail.com', 'nehagoyal36526@gmail.com', 'rahulkumarrk1111@gmail.com'
        ];
        const { data: specData } = await supabase.from('users').select('id').in('email', specialistEmails);
        const specialistIds = specData.map(s => s.id);

        // 3. Find Victims
        const startOfDay = new Date();
        startOfDay.setUTCHours(0, 0, 0, 0);
        const { data: currentLeads } = await supabase.from('leads').select('assigned_to').gte('created_at', startOfDay.toISOString());

        const victimsList = [];
        const { data: freshUsers } = await supabase.from('users').select('id, name, email, leads_today');
        freshUsers.forEach(u => {
            const count = currentLeads.filter(l => l.assigned_to === u.id).length;
            if (u.leads_today > count) {
                victimsList.push({ id: u.id, name: u.name, email: u.email, loss: u.leads_today - count });
            }
        });

        const totalToRestore = victimsList.reduce((a, b) => a + b.loss, 0);
        console.log(`🔍 Found ${victimsList.length} victims who lost ${totalToRestore} leads.`);

        if (totalToRestore === 0) {
            console.log("✅ Nothing to restore.");
            return;
        }

        // 4. Boost Victims Limits Explicitly
        console.log("🚀 Boosting victim limits to 1000...");
        const victimIds = victimsList.map(v => v.id);
        const { error: boostErr } = await supabase.from('users').update({ daily_limit: 1000 }).in('id', victimIds);
        if (boostErr) throw new Error(`Boost failed: ${boostErr.message}`);

        // 5. RESTORE Assignments
        const { data: candidateLeads } = await supabase.from('leads')
            .select('id, name, phone, assigned_to')
            .in('assigned_to', specialistIds)
            .gte('created_at', startOfDay.toISOString());

        let restoredCount = 0;
        let victimIndex = 0;
        for (const lead of (candidateLeads || [])) {
            if (victimIndex >= victimsList.length) break;
            const victim = victimsList[victimIndex];

            console.log(`🔄 Reassigning ${lead.phone} -> ${victim.name}`);
            const { error: updErr } = await supabase.from('leads').update({
                assigned_to: victim.id, user_id: victim.id, notes: 'Restored (Snapshot)'
            }).eq('id', lead.id);

            if (!updErr) {
                restoredCount++;
                victim.loss--;
                if (victim.loss <= 0) victimIndex++;
            } else {
                console.error(`❌ ${updErr.message}`);
            }
            if (restoredCount >= totalToRestore) break;
        }
        console.log(`🎉 Restored ${restoredCount} leads.`);

        // 6. RESTORE original limits from snapshot
        console.log("⏳ Restoring original limits...");
        for (const item of snapshot) {
            let finalLimit = item.daily_limit;
            if (item.email === 'sharmahimanshu9797@gmail.com') finalLimit = 500;

            await supabase.from('users').update({ daily_limit: finalLimit }).eq('id', item.id);
        }
        console.log("✨ Done.");

    } catch (e) {
        console.error(`🛑 ERROR: ${e.message}`);
    }
}

performRevert();
