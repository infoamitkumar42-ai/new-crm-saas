const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = "https://vewqzsqddgmkslnuctvb.supabase.co";
const SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDUzMDQ2MiwiZXhwIjoyMDgwMTA2NDYyfQ.pAgMGN6MtKm1A3fsKr1GIt8-qmKYhwFjSt92L_6_7us";
const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

async function main() {
    console.log("🧹 Clearing unwanted 'Reclaimed from' text from `notes` column...\n");

    let allLeads = [];
    let hasMore = true;
    let page = 0;

    // Fetch leads where notes contains "Reclaimed" or "Manual Halt"
    while (hasMore) {
        const { data: leads, error } = await supabase
            .from('leads')
            .select('id, notes')
            .ilike('notes', '%Reclaimed%')
            .range(page * 1000, (page + 1) * 1000 - 1);

        if (error) {
            console.error("Error fetching leads:", error.message);
            return;
        }

        allLeads = allLeads.concat(leads);
        hasMore = leads.length === 1000;
        page++;
    }

    console.log(`Total leads with 'Reclaimed' in notes: ${allLeads.length}`);

    let clearedCount = 0;

    for (let lead of allLeads) {
        if (!lead.notes) continue;

        // Let's just nullify the note if it's literally just the reclaimed string
        // Or if it contains it, we clear it out entirely since this represents system garbage.
        if (lead.notes.includes('Reclaimed from')) {
            const { error: updErr } = await supabase
                .from('leads')
                .update({ notes: null }) // Set to null to remove the yellow badge
                .eq('id', lead.id);

            if (updErr) {
                console.error(`Error updating lead ${lead.id}:`, updErr.message);
            } else {
                clearedCount++;
            }
        }
    }

    console.log(`\n✅ Successfully cleared notes for ${clearedCount} leads!`);
}

main().catch(console.error);
