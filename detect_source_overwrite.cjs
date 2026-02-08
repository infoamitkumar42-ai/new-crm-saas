
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://vewqzsqddgmkslnuctvb.supabase.co';
const SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDUzMDQ2MiwiZXhwIjoyMDgwMTA2NDYyfQ.pAgMGN6MtKm1A3fsKr1GIt8-qmKYhwFjSt92L_6_7us";

const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

const TEAM_CODE = 'GJ01TEAMFIRE';

async function detectOverwrite() {
    console.log("🕵️ DETECTING SOURCE OVERWRITES...");
    console.log("   Checking if Manual Script leads were actually Old Organic Leads...\n");

    const manualSources = [
        'New chirag campaing (ig)',
        'New chirag campaing (fb)',
        'New chirag campaing – 2 (ig)',
        'Manual Recovery (Final)'
    ];

    // 1. Get Leads with Manual Source
    const { data: leads, error } = await supabase
        .from('leads')
        .select('id, name, phone, source, created_at, assigned_to, users(name)')
        .in('source', manualSources);

    if (error) { console.error(error); return; }

    console.log(`Checking ${leads.length} Manual Script leads for prior history...`);

    let overwriteCount = 0;

    for (const lead of leads) {
        // 2. Check for Activity BEFORE Today (Feb 6)
        // If activity exists, it means lead is OLD (Overwritten)
        const { data: history } = await supabase
            .from('user_activity')
            .select('created_at, user_id')
            .eq('lead_id', lead.id)
            .lt('created_at', '2026-02-06T00:00:00+05:30')
            .limit(1);

        if (history && history.length > 0) {
            overwriteCount++;
            // Uncomment to see details
            // console.log(`⚠️ OVERWRITE: ${lead.phone} (${lead.source}) -> Had History from ${history[0].created_at}`);
        }
    }

    console.log("---------------------------------------------------");
    if (overwriteCount > 0) {
        console.log(`🚨 FOUND ${overwriteCount} LEADS THAT WERE OVERWRITTEN!`);
        console.log("   These leads existed BEFORE (likely Organic) but were updated by the Script.");
        console.log("   This confirms we Re-Assigned some Organic leads.");
        console.log(`   (Total Verified Overlaps: ${overwriteCount})`);
    } else {
        console.log("✅ NO OVERWRITES FOUND.");
        console.log("   The Manual Script leads seem to be completely NEW (Unique).");
    }
}

detectOverwrite();
