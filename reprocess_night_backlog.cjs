const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://vewqzsqddgmkslnuctvb.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDUzMDQ2MiwiZXhwIjoyMDgwMTA2NDYyfQ.pAgMGN6MtKm1A3fsKr1GIt8-qmKYhwFjSt92L_6_7us';
const supabase = createClient(supabaseUrl, supabaseKey);

(async () => {
    // 1. Fetch leads stuck in Night_Backlog since 9 PM
    const now = new Date();
    const cutoff = new Date(now);
    cutoff.setHours(cutoff.getHours() - 4); // safely look back 4 hours

    console.log(`=== 🚑 REPROCESSING NIGHT BACKLOG (Since ${cutoff.toLocaleTimeString()}) ===`);

    const { data: stuckLeads, error } = await supabase
        .from('leads')
        .select('*')
        .eq('status', 'Night_Backlog')
        .gte('created_at', cutoff.toISOString())
        .order('created_at', { ascending: true }); // Process oldest first

    if (error) {
        console.error('Error fetching leads:', error);
        return;
    }

    if (stuckLeads.length === 0) {
        console.log('✅ No stuck leads found. Queue is clean.');
        return;
    }

    console.log(`Found ${stuckLeads.length} stuck leads. Reprocessing...`);

    for (const lead of stuckLeads) {
        console.log(`Processing: ${lead.name} (${lead.phone})...`);

        // Get Team Code from Page Name (Simplified Logic matching webhook)
        let teamCode = 'TEAMFIRE'; // Default
        if (lead.source.includes('Digital Chirag') || lead.source.includes('Bhumit')) teamCode = 'GJ01TEAMFIRE';
        if (lead.source.includes('Rajwinder')) teamCode = 'TEAMRAJ';

        // Call RPC directly to assign
        const { data: bestUser, error: rpcError } = await supabase.rpc('get_best_assignee_for_team', {
            p_team_code: teamCode
        });

        if (rpcError || !bestUser || bestUser.length === 0) {
            console.error(`❌ Failed to find assignee for ${lead.name} (Team ${teamCode})`);
            continue;
        }

        const targetUser = bestUser[0];

        // Atomic Assign
        const { data: assignResult, error: assignError } = await supabase.rpc('assign_lead_atomically', {
            p_lead_name: lead.name,
            p_phone: lead.phone,
            p_city: lead.city || 'Unknown',
            p_source: lead.source,
            p_status: 'Assigned',
            p_user_id: targetUser.user_id,
            p_planned_limit: targetUser.daily_limit_override || targetUser.daily_limit
        });

        if (assignError || !assignResult?.[0]?.success) {
            console.error(`❌ Assign failed for ${lead.name}:`, assignError || assignResult?.[0]?.message);
        } else {
            console.log(`✅ Assigned ${lead.name} -> ${targetUser.user_name} (${targetUser.user_email})`);

            // Delete the old Night_Backlog entry to prevent duplicate
            await supabase.from('leads').delete().eq('id', lead.id);
        }
    }

    console.log('=== 🏁 REPROCESSING COMPLETE ===');
})();
