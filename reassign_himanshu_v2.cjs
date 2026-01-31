const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://vewqzsqddgmkslnuctvb.supabase.co';
const ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ1MzA0NjIsImV4cCI6MjA4MDEwNjQ2Mn0.g-e8YNzEy0Z5ul1RGAhBMDj41TtWGuNPEzZz4XEGPg4";
const supabase = createClient(SUPABASE_URL, ANON_KEY);

async function reassignFromHimanshuV2() {
    console.log("🚀 Starting Reassignment from Himanshu (V2)...");

    // 1. Find Himanshu (Loose Match)
    const { data: users } = await supabase.from('users').select('id, name, leads_today').ilike('name', 'Himanshu%');

    if (!users || users.length === 0) return console.log("❌ No user starting with Himanshu found.");

    // Pick the most likely one (or process all if duplicate)
    console.log(`Found ${users.length} users like Himanshu:`, users.map(u => u.name));

    const himanshu = users[0]; // Assuming first is target
    console.log(`Targeting: ${himanshu.name} (${himanshu.id})`);

    // 2. Get Leads
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();

    const { data: leadsToMove } = await supabase
        .from('leads')
        .select('id, name, phone')
        .eq('user_id', himanshu.id)
        .gte('created_at', todayStart);

    if (!leadsToMove || leadsToMove.length === 0) return console.log("✅ Himanshu has 0 leads today.");

    console.log(`Found ${leadsToMove.length} leads to move.`);

    // 3. Receivers
    const plansOfInterest = ['turbo_boost', 'weekly_boost', 'supervisor', 'starter'];
    const { data: receivers } = await supabase
        .from('users')
        .select('id, name, leads_today, plan_name')
        .eq('is_active', true)
        .neq('id', himanshu.id)
        .in('plan_name', plansOfInterest)
        .order('leads_today', { ascending: true }); // Distribute to lowest counters first

    if (!receivers) return console.log("No receivers.");

    // Sort by Rank
    const planRank = { 'turbo_boost': 4, 'weekly_boost': 3, 'supervisor': 2, 'starter': 1 };
    receivers.sort((a, b) => (planRank[b.plan_name] || 0) - (planRank[a.plan_name] || 0));

    // 4. Distribute
    let idx = 0;
    for (const lead of leadsToMove) {
        const agent = receivers[idx % receivers.length];
        idx++;

        console.log(`🔹 Moving ${lead.name} -> ${agent.name} (${agent.plan_name})`);

        await supabase.from('leads').update({ user_id: agent.id, notes: null }).eq('id', lead.id);

        // Update Counter
        await supabase.from('users').update({ leads_today: (agent.leads_today || 0) + 1 }).eq('id', agent.id);
    }

    // 5. Reset Himanshu
    await supabase.from('users').update({ leads_today: 0 }).eq('id', himanshu.id);
    console.log("Done.");
}

reassignFromHimanshuV2();
