import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://vewqzsqddgmkslnuctvb.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDUzMDQ2MiwiZXhwIjoyMDgwMTA2NDYyfQ.pAgMGN6MtKm1A3fsKr1GIt8-qmKYhwFjSt92L_6_7us';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function investigateAndFix() {
    console.log('🔍 INVESTIGATING RPC FAILURES...\n');

    // 1. Get queued leads
    const thirtyMinAgo = new Date(Date.now() - 30 * 60 * 1000).toISOString();
    const { data: queuedLeads, error: e1 } = await supabase
        .from('leads')
        .select('*')
        .eq('status', 'Queued')
        .gte('created_at', thirtyMinAgo);

    if (e1) {
        console.error('❌ Error fetching queued leads:', e1.message);
        return;
    }

    console.log(`📊 Found ${queuedLeads?.length || 0} queued leads\n`);

    if (!queuedLeads || queuedLeads.length === 0) {
        console.log('✅ No queued leads to process!');
        return;
    }

    // 2. Get meta_pages to map source to team
    const { data: metaPages, error: e2 } = await supabase
        .from('meta_pages')
        .select('page_name, team_id');

    if (e2) {
        console.error('❌ Error fetching meta pages:', e2.message);
        return;
    }

    // 3. For each queued lead, try to find team and assign
    for (const lead of queuedLeads) {
        console.log(`\n🔧 Processing: ${lead.name} (${lead.source})`);

        // Extract page name from source
        const sourceParts = lead.source.split(' - ');
        const pageName = sourceParts[sourceParts.length - 1];

        // Find team
        const page = metaPages?.find(p => lead.source.includes(p.page_name));
        const teamId = page?.team_id;

        if (!teamId) {
            console.log(`   ⚠️ No team found for page: ${pageName}`);
            continue;
        }

        // Get team_code from team
        const { data: team, error: e3 } = await supabase
            .from('teams')
            .select('code')
            .eq('id', teamId)
            .single();

        if (e3 || !team) {
            console.log(`   ⚠️ Team not found for ID: ${teamId}`);
            continue;
        }

        const teamCode = team.code;
        console.log(`   📍 Team Code: ${teamCode}`);

        // Try RPC call
        const { data: bestUser, error: rpcError } = await supabase
            .rpc('get_best_assignee_for_team', { p_team_code: teamCode });

        if (rpcError) {
            console.log(`   ❌ RPC Error: ${rpcError.message}`);
            continue;
        }

        if (!bestUser || bestUser.length === 0) {
            console.log(`   ⚠️ No available users in team ${teamCode}`);
            continue;
        }

        const userId = bestUser[0].user_id;
        const userName = bestUser[0].user_name;

        console.log(`   ✅ Found user: ${userName}`);

        // Assign the lead
        const { data: assignResult, error: assignError } = await supabase
            .rpc('assign_lead_atomically', {
                p_lead_name: lead.name,
                p_phone: lead.phone,
                p_city: lead.city,
                p_source: lead.source,
                p_status: 'Assigned',
                p_user_id: userId
            });

        if (assignError) {
            console.log(`   ❌ Assignment Error: ${assignError.message}`);
            continue;
        }

        // Delete the queued lead
        const { error: deleteError } = await supabase
            .from('leads')
            .delete()
            .eq('id', lead.id);

        if (deleteError) {
            console.log(`   ⚠️ Could not delete queued lead: ${deleteError.message}`);
        } else {
            console.log(`   🎉 Successfully assigned to ${userName}!`);
        }
    }

    console.log('\n✅ BACKLOG PROCESSING COMPLETE\n');
}

investigateAndFix().catch(console.error);
