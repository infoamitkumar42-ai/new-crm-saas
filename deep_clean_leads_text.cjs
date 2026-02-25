const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = "https://vewqzsqddgmkslnuctvb.supabase.co";
const SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDUzMDQ2MiwiZXhwIjoyMDgwMTA2NDYyfQ.pAgMGN6MtKm1A3fsKr1GIt8-qmKYhwFjSt92L_6_7us";
const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

const BAD_TEXTS = [
    'Old queued lead',
    'Atomic assignment failed',
    'Pre-Feb 11',
    'retry needed'
];

async function main() {
    console.log("🔧 Deep Clean: Searching ALL text fields in leads for unwanted text...\n");

    // First, let's see what columns the leads table has
    const { data: sample } = await supabase.from('leads').select('*').limit(1);
    if (sample && sample.length > 0) {
        console.log("Lead table columns:", Object.keys(sample[0]).join(', '));
    }

    // Search each text-like column for the bad text
    const textColumns = ['notes', 'source', 'status', 'name', 'phone', 'email', 'city', 'state'];

    for (let col of textColumns) {
        for (let badText of BAD_TEXTS) {
            const { data: matches, error } = await supabase
                .from('leads')
                .select(`id, ${col}`)
                .ilike(col, `%${badText}%`);

            if (error) continue; // Column might not exist
            if (matches && matches.length > 0) {
                console.log(`\n⚠️ Found "${badText}" in column "${col}" -> ${matches.length} leads`);

                for (let m of matches) {
                    const currentVal = m[col] || '';
                    // Clean: remove the bad text
                    let cleanVal = currentVal;
                    BAD_TEXTS.forEach(bt => {
                        cleanVal = cleanVal.replace(new RegExp(bt + '[^"]*', 'gi'), '').trim();
                    });
                    // If the cleaned value is empty or just whitespace/punctuation, set to null
                    if (!cleanVal || cleanVal.replace(/[^a-zA-Z0-9]/g, '') === '') {
                        cleanVal = null;
                    }

                    const updateObj = {};
                    updateObj[col] = cleanVal;
                    await supabase.from('leads').update(updateObj).eq('id', m.id);
                }
                console.log(`  ✅ Cleaned ${matches.length} leads in "${col}".`);
            }
        }
    }

    // Verify no more matches
    console.log("\n\n🔍 Verification: Checking if any bad text remains...");
    let foundAny = false;
    for (let col of textColumns) {
        for (let badText of BAD_TEXTS) {
            const { data: remaining } = await supabase
                .from('leads')
                .select('id')
                .ilike(col, `%${badText}%`);
            if (remaining && remaining.length > 0) {
                console.log(`  ❌ Still found "${badText}" in "${col}": ${remaining.length} leads`);
                foundAny = true;
            }
        }
    }
    if (!foundAny) {
        console.log("  ✅ ALL CLEAN! No bad text found anywhere in leads.");
    }

    console.log("\n🎉 Deep clean complete!");
}

main().catch(console.error);
