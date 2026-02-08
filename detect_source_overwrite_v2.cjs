
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://vewqzsqddgmkslnuctvb.supabase.co';
const SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDUzMDQ2MiwiZXhwIjoyMDgwMTA2NDYyfQ.pAgMGN6MtKm1A3fsKr1GIt8-qmKYhwFjSt92L_6_7us";

const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

async function detectOverwrite() {
    console.log("🕵️ DETECTING SOURCE OVERWRITES (V2)...");

    const manualSources = [
        'New chirag campaing (ig)',
        'New chirag campaing (fb)',
        'New chirag campaing – 2 (ig)',
        'Manual Recovery (Final)'
    ];

    const { data: leads, error } = await supabase
        .from('leads')
        .select('id, phone, source, created_at')
        .in('source', manualSources);

    if (error) { console.error(error); return; }

    console.log(`Checking ${leads.length} Manual Script leads...`);

    let overwriteCount = 0;

    for (const lead of leads) {
        const { data: history } = await supabase
            .from('user_activity')
            .select('created_at')
            .eq('lead_id', lead.id)
            .lt('created_at', '2026-02-06T00:00:00+05:30')
            .limit(1);

        if (history && history.length > 0) {
            overwriteCount++;
        }
    }

    console.log("---------------------------------------------------");
    if (overwriteCount > 0) {
        console.log(`🚨 FOUND ${overwriteCount} LEADS THAT WERE OVERWRITTEN!`);
    } else {
        console.log("✅ NO OVERWRITES FOUND.");
    }
}

detectOverwrite();
