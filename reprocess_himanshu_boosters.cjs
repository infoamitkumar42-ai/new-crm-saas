const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://vewqzsqddgmkslnuctvb.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDUzMDQ2MiwiZXhwIjoyMDgwMTA2NDYyfQ.pAgMGN6MtKm1A3fsKr1GIt8-qmKYhwFjSt92L_6_7us';
const supabase = createClient(supabaseUrl, supabaseKey);

const TARGET_EMAILS = [
    'ravenjeetkaur@gmail.com', 'vansh.rajni.96@gmail.com', 'payalpuri3299@gmail.com',
    'princyrani303@gmail.com', 'aansh8588@gmail.com', 'nitinanku628@gmail.com',
    'saijelgoel4@gmail.com', 'navpreetkaur95271@gmail.com', 'officialrajinderdhillon@gmail.com',
    'prince@gmail.com', 'jaspreetkaursarao45@gmail.com', 'rupanasameer551@gmail.com',
    'ludhranimohit91@gmail.com', 'goldymahi27@gmail.com', 'amritpalkaursohi358@gmail.com',
    'surjitsingh1067@gmail.com', 'mandeepbrar1325@gmail.com', 'jk419473@gmail.com',
    'punjabivinita@gmail.com', 'ajayk783382@gmail.com', 'samandeepkaur1216@gmail.com',
    'rohitgagneja69@gmail.com', 'ziana4383@gmail.com', 'loveleenkaur8285@gmail.com'
];

(async () => {
    console.log('--- 🚀 REPROCESSING HIMANSHU LEADS FOR THE 24 BOOSTERS ---');

    // 1. Get recent Night_Backlog leads from Himanshu's sources
    const { data: stuckLeads, error: leadError } = await supabase
        .from('leads')
        .select('id, name, phone, source, city, created_at')
        .eq('status', 'Night_Backlog')
        .or('source.ilike.%Himanshu%,source.ilike.%Digital Skills%,source.ilike.%TFE 6444%')
        .order('created_at', { ascending: true });

    if (leadError) {
        console.error('Error fetching leads:', leadError);
        return;
    }

    console.log(`Found ${stuckLeads.length} Himanshu leads in Night_Backlog.`);

    if (stuckLeads.length === 0) return;

    // 2. Resolve target user IDs and current counts
    const { data: users, error: userError } = await supabase
        .from('users')
        .select('id, name, email, leads_today')
        .in('email', TARGET_EMAILS)
        .eq('is_active', true);

    if (userError) {
        console.error('Error fetching target users:', userError);
        return;
    }

    console.log(`Ready to distribute to ${users.length} active boosters.`);

    // 3. Round-robin distribution
    let userIndex = 0;
    // Sort users by leads_today to be fair
    users.sort((a, b) => (a.leads_today || 0) - (b.leads_today || 0));

    for (const lead of stuckLeads) {
        const target = users[userIndex % users.length];

        console.log(`Assigning: ${lead.name} -> ${target.name} (${target.email})`);

        const { data: result, error: assignError } = await supabase.rpc('assign_lead_atomically', {
            p_lead_name: lead.name,
            p_phone: lead.phone,
            p_city: lead.city || 'Unknown',
            p_source: lead.source,
            p_status: 'Assigned',
            p_user_id: target.id,
            p_planned_limit: 500 // Force high limit
        });

        if (assignError || !result?.[0]?.success) {
            console.error(`❌ Failed: ${lead.name} -> ${assignError || result?.[0]?.message}`);
        } else {
            console.log(`✅ Success!`);
            // Clean up backlog
            await supabase.from('leads').delete().eq('id', lead.id);
            // Update local count for fairness in this loop
            target.leads_today = (target.leads_today || 0) + 1;
            // Next user
            userIndex++;
        }
    }

    console.log('--- 🏁 REPROCESSING COMPLETE ---');
})();
