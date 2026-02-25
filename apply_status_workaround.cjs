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

const userPhones = [
    '9829227495', '9811430444', '8427852752', '7977132459', '8770687117',
    '8557823861', '6263553617', '7889518862', '7973464065', '7708254027'
];

(async () => {
    console.log('--- 🚀 APPLYING WORKAROUND FOR 10 META LEADS ---');

    // 1. Fetch Boosters
    const { data: boosters } = await supabase
        .from('users')
        .select('id, name, email')
        .in('email', TARGET_EMAILS)
        .eq('is_active', true);

    if (!boosters || boosters.length === 0) {
        console.error('No boosters found!');
        return;
    }

    // 2. Process the 10 leads
    let idx = 0;
    for (const phone of userPhones) {
        const target = boosters[idx % boosters.length];

        console.log(`Processing Phone: ${phone} -> Sending to ${target.name}...`);

        const { data: matched, error: fetchError } = await supabase
            .from('leads')
            .select('id, name')
            .ilike('phone', `%${phone}%`)
            .eq('status', 'Night_Backlog');

        if (fetchError || !matched || matched.length === 0) {
            console.log(` - Skipping: Not in Night_Backlog or already processed.`);
            continue;
        }

        // Apply Workaround Status: 'Contacted'
        const { error: updateError } = await supabase
            .from('leads')
            .update({
                assigned_to: target.id,
                status: 'Contacted',
                assigned_at: new Date().toISOString()
            })
            .eq('id', matched[0].id);

        if (updateError) {
            console.error(` ❌ Failed for ${phone}: ${updateError.message}`);
        } else {
            console.log(` ✅ SUCCESS: ${matched[0].name} assigned to ${target.name}`);
            idx++;
        }
    }

    console.log('\n--- 🏁 WORKAROUND COMPLETE ---');

})();
