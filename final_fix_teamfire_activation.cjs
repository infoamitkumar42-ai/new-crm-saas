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
    console.log('--- 🚀 FIXING TEAMFIRE ACTIVATION STATE ---');

    // 1. Fetch current active users in TEAMFIRE
    const { data: activeUsers, error: fetchError } = await supabase
        .from('users')
        .select('id, name, email')
        .eq('team_code', 'TEAMFIRE')
        .eq('is_active', true);

    if (fetchError) {
        console.error('Error fetching users:', fetchError);
        return;
    }

    const toDeactivate = activeUsers.filter(u => !TARGET_EMAILS.includes(u.email));

    console.log(`Found ${activeUsers.length} active users. ${toDeactivate.length} need deactivation.`);

    if (toDeactivate.length > 0) {
        const ids = toDeactivate.map(u => u.id);
        const { error: updateError } = await supabase
            .from('users')
            .update({ is_active: false })
            .in('id', ids);

        if (updateError) {
            console.error('Error deactivating users:', updateError);
        } else {
            console.log(`Successfully deactivated: ${toDeactivate.map(u => u.name).join(', ')}`);
        }
    }

    // 2. Final verification
    const { data: finalActive } = await supabase
        .from('users')
        .select('name, email')
        .eq('team_code', 'TEAMFIRE')
        .eq('is_active', true);

    console.log(`Final Active Users in TEAMFIRE: ${finalActive.length}`);
    finalActive.forEach(u => console.log(` - ${u.name} (${u.email})`));
})();
