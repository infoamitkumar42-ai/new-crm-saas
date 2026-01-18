import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://vewqzsqddgmkslnuctvb.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDUzMDQ2MiwiZXhwIjoyMDgwMTA2NDYyfQ.pAgMGN6MtKm1A3fsKr1GIt8-qmKYhwFjSt92L_6_7us';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function findImplicitAssociations() {
    console.log('\n🕵️ --- SEARCHING FOR IMPLICIT USER-LEAD LINKS ---\n');

    // 1. Check 'logs' table for ANY entry that might have lead_id in details
    const { data: interactionLogs } = await supabase
        .from('logs')
        .select('*')
        .not('details', 'is', null)
        .limit(100);

    let restoredCount = 0;
    const inferredAssignments = [];

    if (interactionLogs) {
        console.log(`Analyzing ${interactionLogs.length} logs...`);

        for (const log of interactionLogs) {
            const detailsStr = JSON.stringify(log.details);
            // Look for UUIDs that match known orphan leads
            // This is computationally expensive so we'll just check if it LOOKS like it has a lead connection
            if (detailsStr.includes('lead_id') || detailsStr.includes('leadId')) {
                console.log(`Found Lead Link in Log ${log.id}:`, log.details);
                inferredAssignments.push({
                    userId: log.user_id,
                    logDetails: log.details,
                    timestamp: log.created_at
                });
            }
        }
    }

    // 2. Check if there are any other tables with "lead_id" and "user_id"
    // I will try to "guess" common interaction table names again, focusing on 'history'
    const candidates = ['call_logs', 'calls', 'interactions', 'lead_events', 'events'];

    for (const table of candidates) {
        const { data, error } = await supabase.from(table).select('*').limit(1);
        if (!error) {
            console.log(`Found table: ${table}`);
        }
    }

    console.log(`\nFound ${inferredAssignments.length} potential inferred links.`);

    if (inferredAssignments.length === 0) {
        console.log('❌ No implicit links found in logs.');
        console.log('   The "logs" table seems to only track auth events (login/signup) based on previous checks.');
    }
}

findImplicitAssociations();
