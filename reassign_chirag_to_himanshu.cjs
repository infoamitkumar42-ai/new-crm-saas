
const { createClient } = require('@supabase/supabase-js');
const SUPABASE_URL = 'https://vewqzsqddgmkslnuctvb.supabase.co';
const ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ1MzA0NjIsImV4cCI6MjA4MDEwNjQ2Mn0.g-e8YNzEy0Z5ul1RGAhBMDj41TtWGuNPEzZz4XEGPg4";
const supabase = createClient(SUPABASE_URL, ANON_KEY);

async function reassignLeads() {
    const today = new Date().toISOString().split('T')[0];
    console.log(`🔄 Reassigning Chirag's Team leads to Himanshu's Team...`);

    // 1. Get leads assigned to Chirag's team members today
    // First, find Chirag's team members
    const { data: chiragMembers } = await supabase.from('users').select('id').eq('team_code', 'GJ01TEAMFIRE');
    const chiragIds = chiragMembers.map(m => m.id);

    // Get leads for these members today
    const { data: leadsToMove } = await supabase
        .from('leads')
        .select('id, name')
        .in('assigned_to', chiragIds)
        .gte('created_at', today + 'T00:00:00Z');

    if (!leadsToMove || leadsToMove.length === 0) {
        console.log("📭 No leads found to reassign from Chirag's team today.");
        return;
    }

    console.log(`📦 Found ${leadsToMove.length} leads to reassign.`);

    // 2. Get eligible members from Himanshu's team (Active & Online)
    const { data: himanshuMembers } = await supabase
        .from('users')
        .select('id, name, leads_today')
        .eq('team_code', 'TEAMFIRE')
        .eq('is_active', true)
        .eq('is_online', true)
        .order('leads_today', { ascending: true });

    if (!himanshuMembers || himanshuMembers.length === 0) {
        console.error("❌ No active/online members found in Himanshu's team to receive leads.");
        return;
    }

    // 3. Reassign (Round Robin approach)
    let memberIndex = 0;
    for (const lead of leadsToMove) {
        const targetMember = himanshuMembers[memberIndex % himanshuMembers.length];

        console.log(`   - Moving lead '${lead.name}' ➔ ${targetMember.name}`);

        const { error } = await supabase
            .from('leads')
            .update({
                assigned_to: targetMember.id,
                user_id: targetMember.id, // Ensure ownership is updated too
                status: 'Assigned'
            })
            .eq('id', lead.id);

        if (error) console.error(`   ❌ Failed to reassign lead ${lead.id}:`, error.message);

        // Update user's today count
        const newCount = (targetMember.leads_today || 0) + 1;
        await supabase.from('users').update({ leads_today: newCount }).eq('id', targetMember.id);
        targetMember.leads_today = newCount; // Update local count for sorting/fairness

        memberIndex++;
    }

    console.log("\n✅ Reassignment Complete.");
}

reassignLeads();
