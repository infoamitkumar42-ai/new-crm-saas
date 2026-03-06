const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://vewqzsqddgmkslnuctvb.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDUzMDQ2MiwiZXhwIjoyMDgwMTA2NDYyfQ.pAgMGN6MtKm1A3fsKr1GIt8-qmKYhwFjSt92L_6_7us";

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

const GURPREET_ID = '3a55235b-29cb-4438-b06c-ec4e8839f0df';

async function findSiblings() {
    console.log('--- Finding Sibling Owners ---');
    
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

    console.log(`Analyzing ${duplicates.length} leads...`);

    for (const lead of duplicates) {
        // Find leads created at the same time but NOT assigned to Gurpreet
        const { data: siblings } = await supabase
            .from('leads')
            .select('assigned_to')
            .eq('created_at', lead.created_at)
            .neq('assigned_to', GURPREET_ID)
            .limit(1);

        if (siblings && siblings.length > 0) {
            console.log(`Lead ${lead.name}: Sibling owner is ${siblings[0].assigned_to}`);
            // Revert!
            await supabase.from('leads').update({
                assigned_to: siblings[0].assigned_to,
                user_id: siblings[0].assigned_to,
                assigned_at: lead.created_at // Use creation time as original assignment time
            }).eq('id', lead.id);
        } else {
            console.log(`Lead ${lead.name}: No sibling owner found.`);
            // Try within 1 second?
            const oneSecBefore = new Date(new Date(lead.created_at).getTime() - 1000).toISOString();
            const oneSecAfter = new Date(new Date(lead.created_at).getTime() + 1000).toISOString();
            const { data: closeSiblings } = await supabase
                .from('leads')
                .select('assigned_to')
                .gt('created_at', oneSecBefore)
                .lt('created_at', oneSecAfter)
                .neq('assigned_to', GURPREET_ID)
                .limit(1);
            
            if (closeSiblings && closeSiblings.length > 0) {
                console.log(`Lead ${lead.name}: Close Sibling owner is ${closeSiblings[0].assigned_to}`);
                await supabase.from('leads').update({
                    assigned_to: closeSiblings[0].assigned_to,
                    user_id: closeSiblings[0].assigned_to,
                    assigned_at: lead.created_at
                }).eq('id', lead.id);
            }
        }
    }
    console.log('--- REVERSION COMPLETE ---');
}

findSiblings();
