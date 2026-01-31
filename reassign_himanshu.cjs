const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://vewqzsqddgmkslnuctvb.supabase.co';
const ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ1MzA0NjIsImV4cCI6MjA4MDEwNjQ2Mn0.g-e8YNzEy0Z5ul1RGAhBMDj41TtWGuNPEzZz4XEGPg4";
const supabase = createClient(SUPABASE_URL, ANON_KEY);

async function reassignFromHimanshu() {
    console.log("🚀 Starting Reassignment from Himanshu Sharma...");

    // 1. Get Himanshu's ID
    const { data: himanshu } = await supabase.from('users').select('id, leads_today').eq('name', 'Himanshu Sharma').single();
    if (!himanshu) return console.log("❌ Himanshu Sharma not found.");

    // 2. Get His Leads (Today)
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();

    const { data: leadsToMove, error } = await supabase
        .from('leads')
        .select('id, name, phone')
        .eq('user_id', himanshu.id)
        .gte('created_at', todayStart);

    if (error) return console.error(error);
    if (leadsToMove.length === 0) return console.log("✅ Himanshu has 0 leads today. Nothing to move.");

    console.log(`found ${leadsToMove.length} leads to move.`);

    // 3. Find Receivers (Top Tier, Active, NOT Himanshu)
    const plansOfInterest = ['turbo_boost', 'weekly_boost', 'supervisor', 'starter'];
    const { data: receivers } = await supabase
        .from('users')
        .select('id, name, leads_today, plan_name')
        .eq('is_active', true)
        .neq('id', himanshu.id) // Exclude Himanshu
        .in('plan_name', plansOfInterest)
        .order('leads_today', { ascending: true });

    if (!receivers || receivers.length === 0) return console.log("❌ No active receivers found.");

    // Custom Rank
    const planRank = { 'turbo_boost': 4, 'weekly_boost': 3, 'supervisor': 2, 'starter': 1 };
    receivers.sort((a, b) => (planRank[b.plan_name] || 0) - (planRank[a.plan_name] || 0));

    // 4. Distribute
    let agentIndex = 0;

    for (const lead of leadsToMove) {
        const agent = receivers[agentIndex % receivers.length];
        agentIndex++;

        console.log(`🔹 Moving ${lead.name} -> ${agent.name} (${agent.plan_name})`);

        // Update Lead (Clear notes, new user)
        await supabase
            .from('leads')
            .update({
                user_id: agent.id,
                notes: null, // Clear notes entirely
                updated_at: new Date().toISOString()
            })
            .eq('id', lead.id);

        // Update Counters
        // Increment Receiver
        await supabase.from('users').update({ leads_today: (agent.leads_today || 0) + 1 }).eq('id', agent.id);
        agent.leads_today += 1; // update local for sort logic if needed (not needed for simple RR)
    }

    // 5. Reset Himanshu Count
    await supabase.from('users').update({ leads_today: 0 }).eq('id', himanshu.id);
    console.log(`✅ Himanshu's counter reset to 0.`);
    console.log("🎉 Reassignment Done!");
}

reassignFromHimanshu();
