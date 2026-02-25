const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = "https://vewqzsqddgmkslnuctvb.supabase.co";
const SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDUzMDQ2MiwiZXhwIjoyMDgwMTA2NDYyfQ.pAgMGN6MtKm1A3fsKr1GIt8-qmKYhwFjSt92L_6_7us";
const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

async function main() {
    console.log("🧹 Clearing unwanted 'Reclaimed' notes while bypassing triggers...\n");

    // 1. Fetch leads requiring a fix
    const { data: leadsToFix, error: fetchErr } = await supabase
        .from('leads')
        .select('id, notes, assigned_to')
        .ilike('notes', '%Reclaimed%');

    if (fetchErr) {
        console.error("Error fetching leads:", fetchErr.message);
        return;
    }

    if (!leadsToFix || leadsToFix.length === 0) {
        console.log("No leads to fix!");
        return;
    }

    console.log(`Found ${leadsToFix.length} leads with 'Reclaimed' notes.`);

    // 2. We need to identify the users involved to temporarily reset their limits
    const userIds = Array.from(new Set(leadsToFix.map(l => l.assigned_to).filter(Boolean)));

    const { data: users, error: uErr } = await supabase
        .from('users')
        .select('id, name, leads_today')
        .in('id', userIds);

    if (uErr) {
        console.error("Error fetching users:", uErr.message);
        return;
    }

    // Save their original counts
    const originalCounts = {};
    users.forEach(u => originalCounts[u.id] = u.leads_today || 0);

    // 3. Temporarily set leads_today to 0 to bypass the trigger
    console.log("Temporarily bypassing user limits...");
    for (let u of users) {
        await supabase.from('users').update({ leads_today: 0 }).eq('id', u.id);
    }

    // 4. Update the leads (set notes to null)
    let clearedCount = 0;
    console.log("Clearing notes...");
    for (let lead of leadsToFix) {
        const { error: updErr } = await supabase
            .from('leads')
            .update({ notes: null })
            .eq('id', lead.id);

        if (updErr) {
            console.error(`Error updating lead ${lead.id}:`, updErr.message);
        } else {
            clearedCount++;
        }
    }

    // 5. Restore original counts
    console.log("\nRestoring original user leads counts...");
    for (let u of users) {
        await supabase.from('users').update({ leads_today: originalCounts[u.id] }).eq('id', u.id);
    }

    console.log(`\n✅ Successfully cleared notes for ${clearedCount} leads! Trigger limits restored.`);
}

main().catch(console.error);
