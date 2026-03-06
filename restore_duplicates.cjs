const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://vewqzsqddgmkslnuctvb.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDUzMDQ2MiwiZXhwIjoyMDgwMTA2NDYyfQ.pAgMGN6MtKm1A3fsKr1GIt8-qmKYhwFjSt92L_6_7us";

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

const GURPREET_ID = '3a55235b-29cb-4438-b06c-ec4e8839f0df';

async function restore() {
    console.log('--- Restoring Duplicate Leads ---');

    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();

    // 1. Get leads assigned to her today that are from yesterday's distribution
    const { data: leads } = await supabase
        .from('leads')
        .select('id, name, phone, created_at')
        .eq('assigned_to', GURPREET_ID)
        .gte('assigned_at', todayStart);

    const yesterdayStart = '2026-02-25T18:30:00Z';
    const yesterdayEnd = '2026-02-26T18:30:00Z';

    const duplicates = leads.filter(l => {
        const d = new Date(l.created_at);
        return d >= new Date(yesterdayStart) && d < new Date(yesterdayEnd);
    });

    console.log(`Found ${duplicates.length} leads to revert.`);

    // 2. Try to find original owners from logs
    // We search for logs where details contains the lead ID and it happened yesterday
    let restoredCount = 0;
    for (const lead of duplicates) {
        // We'll search for logs containing this lead ID
        const { data: logs } = await supabase
            .from('logs')
            .select('*')
            .ilike('details::text', `%${lead.id}%`)
            .gte('created_at', yesterdayStart)
            .lt('created_at', yesterdayEnd)
            .order('created_at', { ascending: false });

        if (logs && logs.length > 0) {
            // Find the owner from the log
            // Assuming the log details or user_id tells us who got it
            // Based on FIX_QUEUED_LEADS.js, assignments are logged
            const originalOwner = logs[0].user_id;
            if (originalOwner && originalOwner !== GURPREET_ID) {
                console.log(`Restoring lead ${lead.name} to owner ${originalOwner}`);
                await supabase.from('leads').update({
                    assigned_to: originalOwner,
                    user_id: originalOwner,
                    assigned_at: logs[0].created_at, // Restore original assignment time
                    status: 'Assigned'
                }).eq('id', lead.id);
                restoredCount++;
            }
        } else {
            // If no log, we are stuck. But maybe we can find the owner by checking other leads assigned at the exact same minute?
            // For now, let's just log it.
            console.log(`No restoration log found for ${lead.name}`);
        }
    }

    console.log(`Restored ${restoredCount} leads to original owners.`);
}

restore();
