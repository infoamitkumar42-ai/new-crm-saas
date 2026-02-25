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
    console.log('--- 🔧 EMERGENCY REPAIR: HIMANSHU LEAD DISTRIBUTION ---');

    // 1. Fetch all Himanshu leads from today
    const { data: leads, error: leadError } = await supabase
        .from('leads')
        .select('id, name, source, assigned_to, users!leads_assigned_to_fkey(email, name)')
        .or(HIMANSHU_KEYWORDS.map(k => `source.ilike.%${k}%`).join(','))
        .gte('created_at', new Date().toISOString().split('T')[0] + 'T00:00:00Z');

    if (leadError) {
        console.error('Error fetching leads:', leadError);
        return;
    }

    const misassigned = leads.filter(l => !l.users || !TARGET_EMAILS.includes(l.users.email));
    console.log(`Found ${leads.length} Himanshu leads today. ${misassigned.length} are misassigned.`);

    if (misassigned.length === 0) {
        console.log('✅ All Himanshu leads are correctly assigned.');
        return;
    }

    // 2. Fetch the 24 boosters
    const { data: boosters, error: userError } = await supabase
        .from('users')
        .select('id, name, email, leads_today')
        .in('email', TARGET_EMAILS)
        .eq('is_active', true);

    if (userError) {
        console.error('Error fetching boosters:', userError);
        return;
    }

    console.log(`Reassigning to ${boosters.length} active boosters...`);

    // 3. Reassign
    let boosterIdx = 0;
    // Sort boosters by current leads_today count to keep it fair
    boosters.sort((a, b) => (a.leads_today || 0) - (b.leads_today || 0));

    for (const lead of misassigned) {
        const target = boosters[boosterIdx % boosters.length];
        console.log(`Repairing Lead: ${lead.name} -> Moving to ${target.name} (${target.email})`);

        const { error: updateError } = await supabase
            .from('leads')
            .update({
                assigned_to: target.id,
                status: 'Assigned',
                assigned_at: new Date().toISOString()
            })
            .eq('id', lead.id);

        if (updateError) {
            console.error(`❌ Failed to update ${lead.name}:`, updateError);
        } else {
            console.log(`✅ Success`);
            // Increment local stats for round-robin fairness
            target.leads_today = (target.leads_today || 0) + 1;
            boosterIdx++;
        }
    }

    console.log('--- 🏁 REPAIR COMPLETE ---');
})();
