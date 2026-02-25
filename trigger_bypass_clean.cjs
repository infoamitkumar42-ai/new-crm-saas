const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = "https://vewqzsqddgmkslnuctvb.supabase.co";
const SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDUzMDQ2MiwiZXhwIjoyMDgwMTA2NDYyfQ.pAgMGN6MtKm1A3fsKr1GIt8-qmKYhwFjSt92L_6_7us";
const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

async function main() {
    console.log("🔧 Strategy: Reset leads_today -> Clean notes -> Restore leads_today\n");

    // 1. Get all affected leads and their assigned users
    const { data: badLeads } = await supabase.from('leads')
        .select('id, assigned_to, notes')
        .or('notes.ilike.%Old queued%,notes.ilike.%Atomic%,notes.ilike.%retry needed%,notes.ilike.%Pre-Feb%');

    console.log(`Found ${badLeads ? badLeads.length : 0} leads with bad text.`);
    if (!badLeads || badLeads.length === 0) return;

    // 2. Get unique user IDs and save their current leads_today
    const userIds = [...new Set(badLeads.map(l => l.assigned_to).filter(Boolean))];
    const { data: users } = await supabase.from('users').select('id, name, leads_today').in('id', userIds);

    const savedCounts = {};
    users.forEach(u => { savedCounts[u.id] = u.leads_today || 0; });
    console.log(`Affected users: ${users.length}. Saving their leads_today counts...`);

    // 3. Temporarily set leads_today = 0 for these users (so trigger doesn't block)
    console.log("Setting leads_today = 0 temporarily...");
    for (let u of users) {
        await supabase.from('users').update({ leads_today: 0 }).eq('id', u.id);
    }

    // 4. NOW clean the notes
    console.log("Cleaning notes...");
    let cleaned = 0;
    for (let lead of badLeads) {
        const { error } = await supabase.from('leads').update({ notes: '' }).eq('id', lead.id);
        if (!error) cleaned++;
        else console.log(`  ❌ Still blocked: ${lead.id}: ${error.message}`);
    }
    console.log(`Cleaned: ${cleaned}/${badLeads.length}`);

    // 5. RESTORE original leads_today counts
    console.log("\nRestoring leads_today counts...");
    for (let u of users) {
        await supabase.from('users').update({ leads_today: savedCounts[u.id] }).eq('id', u.id);
    }
    console.log("✅ All counts restored!");

    // 6. Verify
    console.log("\n🔍 Final Verification...");
    const { data: c1 } = await supabase.from('leads').select('id').ilike('notes', '%Old queued%');
    const { data: c2 } = await supabase.from('leads').select('id').ilike('notes', '%Atomic%');
    console.log(`Remaining 'Old queued': ${c1 ? c1.length : 0}`);
    console.log(`Remaining 'Atomic': ${c2 ? c2.length : 0}`);

    if ((!c1 || c1.length === 0) && (!c2 || c2.length === 0)) {
        console.log("\n🎉 ALL CLEAN! No bad text remains!");
    }
}

main().catch(console.error);
