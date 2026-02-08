
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://vewqzsqddgmkslnuctvb.supabase.co';
const SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDUzMDQ2MiwiZXhwIjoyMDgwMTA2NDYyfQ.pAgMGN6MtKm1A3fsKr1GIt8-qmKYhwFjSt92L_6_7us";

const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

async function assignOrphans() {
    console.log("🚀 Starting Assignment of Orphan Leads to Himanshu's Team...");

    // 1. Identify Target Team (Himanshu)
    // We assume TEAMFIRE. Let's verify by finding 'Himanshu Sharma' or similar
    const { data: himanshu } = await supabase.from('users').select('team_code').ilike('name', '%Himanshu%').limit(1);
    const TEAM_CODE = himanshu && himanshu.length > 0 ? himanshu[0].team_code : 'TEAMFIRE';
    console.log(`Target Team Code: ${TEAM_CODE}`);

    // 2. Fetch Orphan Leads
    const { data: leads } = await supabase
        .from('leads')
        .select('id, name, phone, status')
        .or('status.eq.New,status.eq.Orphan')
        .eq('source', 'facebook'); // Specific junk source

    if (!leads || leads.length === 0) {
        console.log("✅ No 'facebook' source orphan leads found.");
        return;
    }

    console.log(`Found ${leads.length} Orphan Leads to Distribute.`);

    // 3. Get Active Users of Team
    const { data: users } = await supabase
        .from('users')
        .select('id, name, leads_today, daily_limit')
        .eq('team_code', TEAM_CODE)
        .eq('is_active', true)
        .lt('leads_today', 50) // Safety Cap
        .order('leads_today', { ascending: true });

    if (!users || users.length === 0) {
        console.error("❌ No Active Users found in Team to receive leads.");
        return;
    }

    console.log(`Distributing among ${users.length} active users...`);

    // 4. Distribution Loop
    let userIndex = 0;

    for (const lead of leads) {
        const user = users[userIndex];

        // Assign
        await supabase.from('leads').update({
            assigned_to: user.id,
            status: 'Assigned',
            source: 'Facebook Orphan Rescue' // Tagging them
        }).eq('id', lead.id);

        // Update Counter
        user.leads_today += 1;
        await supabase.from('users').update({ leads_today: user.leads_today }).eq('id', user.id);

        console.log(`✅ Assigned ${lead.name.substring(0, 15)}... -> ${user.name}`);

        // Rotate
        userIndex = (userIndex + 1) % users.length;
    }

    console.log("🎉 All Orphans Assigned Successfully.");
}

assignOrphans();
