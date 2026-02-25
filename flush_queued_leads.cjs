const { createClient } = require('@supabase/supabase-js');
const s = createClient('https://vewqzsqddgmkslnuctvb.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDUzMDQ2MiwiZXhwIjoyMDgwMTA2NDYyfQ.pAgMGN6MtKm1A3fsKr1GIt8-qmKYhwFjSt92L_6_7us');

(async () => {
    try {
        console.log('--- FETCHING QUEUED LEADS ---');
        const { data: queuedLeads } = await s.from('leads')
            .select('id, name, source')
            .eq('status', 'Queued')
            .gte('created_at', new Date().toISOString().split('T')[0] + 'T00:00:00Z');

        if (!queuedLeads || queuedLeads.length === 0) {
            console.log('No queued leads found today.');
            return;
        }

        console.log(`Found ${queuedLeads.length} queued leads.`);

        for (const lead of queuedLeads) {
            // Get best assignee for TEAMFIRE
            const { data: best } = await s.rpc('get_best_assignee_for_team', { p_team_code: 'TEAMFIRE' });

            if (best && best.length > 0) {
                const target = best[0];
                const targetId = target.user_id || target.out_user_id;

                console.log(`Assigning ${lead.name} -> ${target.user_name} (${targetId})`);

                const { error: assignError } = await s.from('leads')
                    .update({
                        status: 'Assigned',
                        assigned_to: targetId,
                        user_id: targetId,
                        assigned_at: new Date().toISOString(),
                        notes: 'Recovered from Atomic Queue'
                    })
                    .eq('id', lead.id);

                if (!assignError) {
                    // Try to update counter, but don't fail if exec_sql is missing
                    const { error: rpcErr } = await s.rpc('exec_sql', {
                        sql_query: `UPDATE users SET leads_today = leads_today + 1 WHERE id = '${targetId}'`
                    });
                    if (rpcErr) console.log('Counter sync skipped.');
                } else {
                    console.error(`Failed to assign ${lead.id}:`, assignError.message);
                }
            } else {
                console.log('No eligible users found for TEAMFIRE. Stopping recovery.');
                break;
            }
        }
        console.log('--- RECOVERY COMPLETE ---');
    } catch (e) {
        console.error('Fatal recovery error:', e);
    }
})();
