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
    console.log('--- 🚀 FINAL RECOVERY: HIMANSHU BACKLOG ---');

    // 1. Fetch remaining Himanshu leads in Night_Backlog
    const { data: stuckLeads, error: fetchError } = await supabase
        .from('leads')
        .select('id, name, source')
        .eq('status', 'Night_Backlog');

    if (fetchError) return;

    const hLeads = stuckLeads.filter(l => l.source && HIMANSHU_KEYWORDS.some(k => l.source.includes(k)));
    console.log(`Found ${hLeads.length} Himanshu leads to recover.`);

    if (hLeads.length === 0) return;

    // 2. Fetch active boosters
    const { data: boosters } = await supabase
        .from('users')
        .select('id, name, email')
        .in('email', TARGET_EMAILS)
        .eq('is_active', true);

    // 3. Reassign
    let idx = 0;
    for (const lead of hLeads) {
        const target = boosters[idx % boosters.length];

        const { error: updateError } = await supabase
            .from('leads')
            .update({
                assigned_to: target.id,
                status: 'Contacted',
                assigned_at: new Date().toISOString()
            })
            .eq('id', lead.id);

        if (!updateError) {
            console.log(` ✅ SUCCESS: ${lead.name} -> ${target.name}`);
            idx++;
        }
    }

    console.log('\n--- 🏁 RECOVERY COMPLETE ---');
})();
