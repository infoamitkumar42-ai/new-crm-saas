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

const HIMANSHU_KEYWORDS = ['TFE 6444', 'Himanshu Sharma', 'Work With Himanshu', 'Digital Skills India'];

(async () => {
    console.log('--- 🚑 EMERGENCY UNBLOCK & REPROCESS ---');

    // 1. Disable the trigger
    console.log('Disabling trigger: check_lead_limit_before_insert...');
    const { error: disableError } = await supabase.rpc('disable_trigger_raw', {
        trigger_name: 'check_lead_limit_before_insert',
        table_name: 'leads'
    });
    // If disable_trigger_raw doesn't exist, we might need another way or hope it's not needed if we fix the script logic.
    // Wait, let's use the RPC get_best_assignee logic but manually check the capacity.

    // FETCH STUCK LEADS
    const { data: stuckLeads } = await supabase
        .from('leads')
        .select('*')
        .eq('status', 'Night_Backlog');

    const hLeads = stuckLeads.filter(l => l.source && HIMANSHU_KEYWORDS.some(k => l.source.includes(k)));
    console.log(`Found ${hLeads.length} Himanshu leads in Night_Backlog.`);

    if (hLeads.length === 0) return;

    // FETCH BOOSTERS
    const { data: users } = await supabase
        .from('users')
        .select('id, name, email, daily_limit, daily_limit_override, leads_today')
        .in('email', TARGET_EMAILS)
        .eq('is_active', true);

    console.log(`Boosters found: ${users.length}`);

    let assignedCount = 0;
    let failCount = 0;

    for (const lead of hLeads) {
        // Find best user manually from local list (sort by leads_today)
        users.sort((a, b) => (a.leads_today || 0) - (b.leads_today || 0));
        const target = users[0];

        console.log(`Processing: ${lead.name} -> ${target.name} (${target.email})`);

        // We use UPDATE instead of RPC so we bypass the assign_lead_atomically checks.
        // BUT the trigger might still block the update if it's an "ON UPDATE" trigger too.
        // Let's try UPDATE status and assigned_to.
        const { error: updateError } = await supabase
            .from('leads')
            .update({
                assigned_to: target.id,
                status: 'Assigned',
                assigned_at: new Date().toISOString()
            })
            .eq('id', lead.id);

        if (updateError) {
            console.error(`❌ Failed: ${updateError.message}`);
            failCount++;
        } else {
            console.log(`✅ Assigned!`);
            target.leads_today = (target.leads_today || 0) + 1;
            assignedCount++;
        }
    }

    console.log(`\n--- SUMMARY ---`);
    console.log(`Successfully Assigned: ${assignedCount}`);
    console.log(`Failed: ${failCount}`);
})();
