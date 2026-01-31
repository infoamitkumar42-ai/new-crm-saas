const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://vewqzsqddgmkslnuctvb.supabase.co';
const ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ1MzA0NjIsImV4cCI6MjA4MDEwNjQ2Mn0.g-e8YNzEy0Z5ul1RGAhBMDj41TtWGuNPEzZz4XEGPg4";
const supabase = createClient(SUPABASE_URL, ANON_KEY);

async function reassignFromAllHimanshu() {
    console.log("🚀 Checking ALL Himanshu users...");

    // 1. Find ALL Himanshus
    const { data: users } = await supabase.from('users').select('id, name, leads_today').ilike('name', 'Himanshu%');

    if (!users) return console.log("No Himanshu found.");

    // 2. Receivers (Load once)
    const plansOfInterest = ['turbo_boost', 'weekly_boost', 'supervisor', 'starter'];
    const { data: receivers } = await supabase
        .from('users')
        .select('id, name, leads_today, plan_name')
        .eq('is_active', true)
        .in('plan_name', plansOfInterest)
        .order('leads_today', { ascending: true }); // Lowest first

    if (!receivers) return console.log("No receivers.");

    // Filter receivers: Exclude ANY Himanshu ID
    const himanshuIds = users.map(u => u.id);
    const validReceivers = receivers.filter(r => !himanshuIds.includes(r.id));

    // Sort
    const planRank = { 'turbo_boost': 4, 'weekly_boost': 3, 'supervisor': 2, 'starter': 1 };
    validReceivers.sort((a, b) => (planRank[b.plan_name] || 0) - (planRank[a.plan_name] || 0));

    // 3. Process Each Himanshu
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();

    let receiverIdx = 0;

    for (const user of users) {
        console.log(`\n🔍 Checking User: ${user.name} (${user.id}) [Count: ${user.leads_today}]`);

        const { data: leads } = await supabase
            .from('leads')
            .select('id, name')
            .eq('user_id', user.id)
            .gte('created_at', todayStart);

        if (!leads || leads.length === 0) {
            console.log("   No leads found today.");
            // Reset counter anyway if > 0
            if (user.leads_today > 0) {
                await supabase.from('users').update({ leads_today: 0 }).eq('id', user.id);
                console.log("   Counter reset to 0.");
            }
            continue;
        }

        console.log(`   Found ${leads.length} leads. Moving...`);

        for (const lead of leads) {
            const dest = validReceivers[receiverIdx % validReceivers.length];
            receiverIdx++;

            console.log(`   🔹 ${lead.name} -> ${dest.name}`);

            await supabase.from('leads').update({ user_id: dest.id, notes: null }).eq('id', lead.id);
            await supabase.from('users').update({ leads_today: (dest.leads_today || 0) + 1 }).eq('id', dest.id);
            dest.leads_today++; // Update local
        }

        await supabase.from('users').update({ leads_today: 0 }).eq('id', user.id);
        console.log("   User cleaned.");
    }
}

reassignFromAllHimanshu();
