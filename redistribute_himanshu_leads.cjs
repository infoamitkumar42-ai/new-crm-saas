const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = "https://vewqzsqddgmkslnuctvb.supabase.co";
const SUPABASE_SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDUzMDQ2MiwiZXhwIjoyMDgwMTA2NDYyfQ.pAgMGN6MtKm1A3fsKr1GIt8-qmKYhwFjSt92L_6_7us";

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function redistributeLeads() {
    console.log("🚀 Starting Redistribution for Himanshu Team Specialists...");

    const emails = [
        'ludhranimohit91@gmail.com', 'dineshmonga22@gmail.com', 'dhawantanu536@gmail.com',
        'harmandeepkaurmanes790@gmail.com', 'payalpuri3299@gmail.com', 'vansh.rajni.96@gmail.com',
        'rupanasameer551@gmail.com', 'loveleenkaur8285@gmail.com', 'rohitgagneja69@gmail.com',
        'rasganiya98775@gmail.com', 'jerryvibes.444@gmail.com', 'brark5763@gmail.com',
        'sharmahimanshu9797@gmail.com', 'rrai26597@gmail.com', 'samandeepkaur1216@gmail.com',
        'dbrar8826@gmail.com', 'nehagoyal36526@gmail.com', 'rahulkumarrk1111@gmail.com'
    ];

    // 1. Fetch Fresh Leads from today
    const startOfDay = new Date();
    startOfDay.setUTCHours(0, 0, 0, 0);

    const { data: freshLeads, error: leadError } = await supabase
        .from('leads')
        .select('*')
        .eq('status', 'Fresh')
        .ilike('source', '%Himanshu%')
        .gte('created_at', startOfDay.toISOString());

    if (leadError) throw leadError;
    console.log(`📦 Found ${freshLeads.length} Fresh leads from Himanshu's page.`);

    if (freshLeads.length === 0) return;

    // 2. Fetch the 18 target users
    const { data: users, error: userError } = await supabase
        .from('users')
        .select('id, name, email, leads_today, daily_limit')
        .in('email', emails)
        .eq('is_active', true)
        .eq('is_online', true);

    if (userError) throw userError;
    console.log(`👤 Found ${users.length} eligible online specialists.`);

    if (users.length === 0) return;

    // 3. Redistribute
    let leadIndex = 0;
    let assignedCount = 0;

    for (const lead of freshLeads) {
        // Find best candidate (least leads today)
        users.sort((a, b) => (a.leads_today || 0) - (b.leads_today || 0));
        const target = users[0];

        if ((target.leads_today || 0) >= (target.daily_limit || 0)) {
            // Check if others still have space? 
            // If everyone is full, skip or force assign to boss?
            if (target.email === 'sharmahimanshu9797@gmail.com') {
                // Keep going for Himanshu (he is the manager)
            } else {
                // For now, let's keep it fair. If all 18 are full, we stop.
                const anySpace = users.some(u => (u.leads_today || 0) < (u.daily_limit || 0));
                if (!anySpace && target.email !== 'sharmahimanshu9797@gmail.com') break;
            }
        }

        console.log(`✅ Assigning [${lead.phone}] to ${target.name} (${target.email})`);

        // Update Lead
        const { error: updateError } = await supabase
            .from('leads')
            .update({
                status: 'Assigned',
                user_id: target.id,
                assigned_to: target.id,
                assigned_at: new Date().toISOString()
            })
            .eq('id', lead.id);

        if (!updateError) {
            // Update local count
            target.leads_today = (target.leads_today || 0) + 1;
            // Update DB count
            await supabase.rpc('increment_leads_today', { user_id: target.id });
            assignedCount++;
        } else {
            console.error(`❌ Error assigning lead ${lead.id}:`, updateError.message);
        }

        leadIndex++;
    }

    console.log(`\n🎉 DONE! Assigned ${assignedCount} leads to the specialists.`);
}

redistributeLeads();
