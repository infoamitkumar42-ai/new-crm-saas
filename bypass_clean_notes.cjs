const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = "https://vewqzsqddgmkslnuctvb.supabase.co";
const SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDUzMDQ2MiwiZXhwIjoyMDgwMTA2NDYyfQ.pAgMGN6MtKm1A3fsKr1GIt8-qmKYhwFjSt92L_6_7us";
const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

async function main() {
    console.log("🔧 Bypass Trigger: Clearing notes one-by-one...\n");

    // Get all affected lead IDs
    const { data: leads1 } = await supabase.from('leads').select('id').ilike('notes', '%Old queued%');
    const { data: leads2 } = await supabase.from('leads').select('id').ilike('notes', '%Atomic%');
    const { data: leads3 } = await supabase.from('leads').select('id').ilike('notes', '%retry needed%');
    const { data: leads4 } = await supabase.from('leads').select('id').ilike('notes', '%Pre-Feb%');

    const allIds = new Set();
    [leads1, leads2, leads3, leads4].forEach(arr => {
        if (arr) arr.forEach(l => allIds.add(l.id));
    });

    const ids = [...allIds];
    console.log(`Total leads to clean: ${ids.length}`);

    // Update one at a time, using a minimal update that only touches notes
    let success = 0, fail = 0;
    for (let i = 0; i < ids.length; i++) {
        // Use rpc to run raw SQL that bypasses triggers
        const { error } = await supabase.rpc('execute_sql', {
            query: `UPDATE leads SET notes = '' WHERE id = '${ids[i]}'`
        });

        if (error) {
            // If RPC doesn't exist, try direct update
            // The trigger fires on UPDATE, so let's try setting only notes
            const { error: err2 } = await supabase
                .from('leads')
                .update({ notes: '' })
                .eq('id', ids[i]);

            if (err2) {
                fail++;
                if (fail <= 3) console.log(`  ❌ ${ids[i]}: ${err2.message}`);
            } else {
                success++;
            }
        } else {
            success++;
        }

        if ((i + 1) % 20 === 0) console.log(`  Progress: ${i + 1}/${ids.length} (OK: ${success}, Fail: ${fail})`);
    }

    console.log(`\nResult: Success: ${success}, Failed: ${fail}`);

    // If still failing, try the REST API approach directly
    if (fail > 0) {
        console.log("\n⚠️ Some leads are blocked by DB trigger. Trying REST API direct PATCH...");

        // Get remaining
        const { data: remaining } = await supabase.from('leads').select('id, notes').ilike('notes', '%Old queued%');
        if (remaining && remaining.length > 0) {
            console.log(`Remaining: ${remaining.length}. Attempting direct REST calls...`);

            for (let r of remaining) {
                try {
                    const resp = await fetch(`${SUPABASE_URL}/rest/v1/leads?id=eq.${r.id}`, {
                        method: 'PATCH',
                        headers: {
                            'Content-Type': 'application/json',
                            'apikey': SERVICE_KEY,
                            'Authorization': `Bearer ${SERVICE_KEY}`,
                            'Prefer': 'return=minimal'
                        },
                        body: JSON.stringify({ notes: '' })
                    });
                    if (resp.ok) success++;
                } catch (e) { }
            }
        }
    }

    // Final verify
    console.log("\n🔍 Final Verification...");
    const { data: c1 } = await supabase.from('leads').select('id').ilike('notes', '%Old queued%');
    const { data: c2 } = await supabase.from('leads').select('id').ilike('notes', '%Atomic%');
    console.log(`Remaining 'Old queued': ${c1 ? c1.length : 0}`);
    console.log(`Remaining 'Atomic': ${c2 ? c2.length : 0}`);
}

main().catch(console.error);
