
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://vewqzsqddgmkslnuctvb.supabase.co';
const SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDUzMDQ2MiwiZXhwIjoyMDgwMTA2NDYyfQ.pAgMGN6MtKm1A3fsKr1GIt8-qmKYhwFjSt92L_6_7us";

const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

async function clean() {
    console.log("🧹 CLEANING UP RE-ASSIGNED LEADS (Removing Old Notes/History)...");

    // 1. Find leads distributed in the last hour
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();

    const { data: leads, error } = await supabase
        .from('leads')
        .select('id, name, notes, phone')
        .gte('assigned_at', oneHourAgo) // Only touch what we just touched
        .ilike('source', '%chirag%'); // Only this campaign

    if (error || !leads) {
        console.error("Error fetching leads:", error);
        return;
    }

    console.log(`FOUND ${leads.length} LEADS TO CLEAN.`);

    let cleanedCount = 0;

    for (const lead of leads) {
        // Only clean if notes exist
        if (lead.notes) {
            // OPTIONAL: Archive old notes? No, user wants them FRESH.
            // Resetting...
            await supabase.from('leads')
                .update({
                    notes: null, // Clear notes
                    contacted_at: null, // Reset interaction
                    closed_at: null,
                    status: 'Assigned', // Ensure status is New/Assigned
                    is_replaced: false,
                    replacement_reason: null
                })
                .eq('id', lead.id);

            cleanedCount++;
            // console.log(`   Cleaned ${lead.name}`);
        }
    }

    console.log(`✅ SUCCESSFULLY CLEANED ${cleanedCount} LEADS.`);
    console.log("   (Notes removed, status reset to Assigned)");
}

clean();
