const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://vewqzsqddgmkslnuctvb.supabase.co';
const ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ1MzA0NjIsImV4cCI6MjA4MDEwNjQ2Mn0.g-e8YNzEy0Z5ul1RGAhBMDj41TtWGuNPEzZz4XEGPg4";
const supabase = createClient(SUPABASE_URL, ANON_KEY);

const RAW_LEADS = [
    { name: "lovepreet singh", phone: "9855050177", city: "Abohar" },
    { name: "Happy sharma", phone: "8427455802", city: "Amritsar" },
    { name: "Meena rani", phone: "6280037334", city: "Muktsar" },
    { name: "Rohit Wandraw", phone: "7009639796", city: "Jalandhar" },
    { name: "Lovepreet kaur", phone: "6283357155", city: "Moga" },
    { name: "Waheguru Ji", phone: "8557013730", city: "Amritsar" },
    { name: "Rajveer _Sidhu", phone: "8264084158", city: "Maur mandi" }
];

async function processBatch() {
    console.log(`🚀 Processing Noted Batch of ${RAW_LEADS.length} Leads...`);

    // 1. FIND ELIGIBLE AGENTS
    const plansOfInterest = ['turbo_boost', 'weekly_boost', 'supervisor', 'starter'];

    const { data: activeUsers, error: uError } = await supabase
        .from('users')
        .select('id, name, plan_name, leads_today')
        .eq('is_active', true)
        .in('plan_name', plansOfInterest)
        .order('leads_today', { ascending: true }); // Give to those with fewer leads first

    if (!activeUsers || activeUsers.length === 0) return console.log("❌ No Active Agents found.");

    // Custom Rank Sort (Turbo First)
    const planRank = { 'turbo_boost': 4, 'weekly_boost': 3, 'supervisor': 2, 'starter': 1 };
    activeUsers.sort((a, b) => (planRank[b.plan_name] || 0) - (planRank[a.plan_name] || 0));

    // 2. ASSIGNMENT LOOP
    let userIndex = 0;

    for (const lead of RAW_LEADS) {
        // Pick Agent
        const agent = activeUsers[userIndex % activeUsers.length];
        userIndex++;

        // Clean Phone
        const cleanPhone = lead.phone.replace(/\D/g, '').slice(-10);

        console.log(`🔹 Assigning ${lead.name} (${cleanPhone}) -> ${agent.name} (${agent.plan_name})`);

        // Check if exists
        const { data: existing } = await supabase.from('leads').select('id').eq('phone', cleanPhone).maybeSingle();

        if (existing) {
            // Update
            await supabase.from('leads').update({
                user_id: agent.id,
                status: 'fresh', // Reset to fresh so they notice it
                notes: 'Manual Batch Import',
                updated_at: new Date().toISOString()
            }).eq('id', existing.id);
        } else {
            // Insert
            await supabase.from('leads').insert({
                name: lead.name,
                phone: cleanPhone,
                city: lead.city,
                user_id: agent.id,
                status: 'fresh',
                source: 'Manual Import',
                created_at: new Date().toISOString()
            });
        }

        // Update Agent Counter
        // We do this individually to be safe
        const { data: freshAgent } = await supabase.from('users').select('leads_today').eq('id', agent.id).single();
        await supabase.from('users').update({ leads_today: (freshAgent.leads_today || 0) + 1 }).eq('id', agent.id);
    }

    console.log("\n✅ Batch Distribution Complete!");
}

processBatch();
