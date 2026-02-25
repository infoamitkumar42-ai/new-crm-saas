const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = "https://vewqzsqddgmkslnuctvb.supabase.co";
const SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDUzMDQ2MiwiZXhwIjoyMDgwMTA2NDYyfQ.pAgMGN6MtKm1A3fsKr1GIt8-qmKYhwFjSt92L_6_7us";
const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

async function main() {
    console.log("🔧 BRUTE FORCE: Setting notes=NULL for ALL leads with bad text...\n");

    // Find ALL leads with any of the bad texts in notes
    const { data: leads1 } = await supabase.from('leads').select('id').ilike('notes', '%Old queued%');
    const { data: leads2 } = await supabase.from('leads').select('id').ilike('notes', '%Atomic assignment%');
    const { data: leads3 } = await supabase.from('leads').select('id').ilike('notes', '%retry needed%');
    const { data: leads4 } = await supabase.from('leads').select('id').ilike('notes', '%Pre-Feb%');

    // Combine all unique IDs
    const allIds = new Set();
    [leads1, leads2, leads3, leads4].forEach(arr => {
        if (arr) arr.forEach(l => allIds.add(l.id));
    });

    const ids = [...allIds];
    console.log(`Found ${ids.length} leads with bad text in notes.`);

    // Force update in batches
    for (let i = 0; i < ids.length; i += 20) {
        const batch = ids.slice(i, i + 20);
        const { error } = await supabase
            .from('leads')
            .update({ notes: '' })
            .in('id', batch);
        if (error) console.error(`  Batch error: ${error.message}`);
        else if ((i + 20) % 100 === 0) console.log(`  Cleared ${Math.min(i + 20, ids.length)}/${ids.length}...`);
    }

    console.log(`\n✅ Force-cleared notes for ${ids.length} leads.`);

    // Verify
    console.log("\n🔍 Verifying...");
    const { data: check1 } = await supabase.from('leads').select('id').ilike('notes', '%Old queued%');
    const { data: check2 } = await supabase.from('leads').select('id').ilike('notes', '%Atomic%');

    console.log(`Remaining 'Old queued': ${check1 ? check1.length : 0}`);
    console.log(`Remaining 'Atomic': ${check2 ? check2.length : 0}`);

    if ((!check1 || check1.length === 0) && (!check2 || check2.length === 0)) {
        console.log("\n✅ ALL CLEAN! No bad text remains!");
    } else {
        console.log("\n⚠️ Some still remain. May need RPC/SQL approach.");
    }
}

main().catch(console.error);
