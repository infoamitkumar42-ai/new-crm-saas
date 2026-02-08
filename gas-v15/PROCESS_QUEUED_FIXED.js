import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://vewqzsqddgmkslnuctvb.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDUzMDQ2MiwiZXhwIjoyMDgwMTA2NDYyfQ.pAgMGN6MtKm1A3fsKr1GIt8-qmKYhwFjSt92L_6_7us';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function fixQueuedLeadsPermanently() {
    console.log('🚀 FIXING QUEUED LEADS - DIRECT APPROACH\n');

    // Get queued leads
    const thirtyMinAgo = new Date(Date.now() - 30 * 60 * 1000).toISOString();
    const { data: queuedLeads, error: e1 } = await supabase
        .from('leads')
        .select('*')
        .eq('status', 'Queued')
        .gte('created_at', thirtyMinAgo);

    if (e1) {
        console.error('❌ Error:', e1.message);
        return;
    }

    console.log(`📊 Found ${queuedLeads?.length || 0} queued leads\n`);

    if (!queuedLeads || queuedLeads.length === 0) {
        console.log('✅ No queued leads!');
        return;
    }

    // Get meta_pages with team mapping
    const { data: metaPages, error: e2 } = await supabase
        .from('meta_pages')
        .select('page_name, team_id');

    if (e2) {
        console.error('❌ Error fetching pages:', e2.message);
        return;
    }

    for (const lead of queuedLeads) {
        console.log(`\n🔧 ${lead.name} (${lead.source})`);

        // Find page and get team code DIRECTLY (team_id actually contains team_code!)
        const page = metaPages?.find(p => lead.source.includes(p.page_name));

        if (!page || !page.team_id) {
            console.log(`   ⚠️ No team mapping found`);
            continue;
        }

        const teamCode = page.team_id; // This IS the team code!
        console.log(`   📍 Team: ${teamCode}`);

        // Get best user
        const { data: bestUser, error: rpcError } = await supabase
            .rpc('get_best_assignee_for_team', { p_team_code: teamCode });

        if (rpcError) {
            console.log(`   ❌ RPC Error: ${rpcError.message}`);
            continue;
        }

        if (!bestUser || bestUser.length === 0) {
            console.log(`   ⚠️ No available users in ${teamCode}`);
            continue;
        }

        const userId = bestUser[0].user_id;
        const userName = bestUser[0].user_name;

        console.log(`   👤 Assigning to: ${userName}`);

        // Use atomic assign
        const { data: result, error: assignError } = await supabase
            .rpc('assign_lead_atomically', {
                p_lead_name: lead.name,
                p_phone: lead.phone,
                p_city: lead.city,
                p_source: lead.source,
                p_status: 'Assigned',
                p_user_id: userId
            });

        if (assignError) {
            console.log(`   ❌ Assignment failed: ${assignError.message}`);
            continue;
        }

        // Delete queued lead
        const { error: delError } = await supabase
            .from('leads')
            .delete()
            .eq('id', lead.id);

        if (!delError) {
            console.log(`   ✅ SUCCESS!`);
        } else {
            console.log(`   ⚠️ Assigned but couldn't delete queued copy`);
        }
    }

    console.log('\n🎉 ALL QUEUED LEADS PROCESSED!\n');
}

fixQueuedLeadsPermanently().catch(console.error);
