const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://vewqzsqddgmkslnuctvb.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDUzMDQ2MiwiZXhwIjoyMDgwMTA2NDYyfQ.pAgMGN6MtKm1A3fsKr1GIt8-qmKYhwFjSt92L_6_7us';
const supabase = createClient(supabaseUrl, supabaseKey);

const updates = [
    { email: 'loveleenkaur8285@gmail.com', add: 90 },
    { email: 'salonirajput78690@gmail.com', add: 55 },
    { email: 'priyaarora50505@gmail.com', add: 55 },
    { email: 'muskanchopra376@gmail.com', add: 55 },
    { email: 'harmandeepkaurmanes790@gmail.com', add: 175 },
    { email: 'priyajotgoyal@gmail.com', add: 55 }
];

(async () => {
    console.log('=== BULK QUOTA CORRECTION START ===');

    for (const update of updates) {
        // 1. Fetch current status
        const { data: user, error: fetchError } = await supabase
            .from('users')
            .select('id, name, total_leads_promised, total_leads_received')
            .eq('email', update.email)
            .single();

        if (fetchError || !user) {
            console.error(`❌ Failed to find user ${update.email}:`, fetchError?.message);
            continue;
        }

        const currentPromised = user.total_leads_promised || 0;
        const newPromised = currentPromised + update.add;

        console.log(`User: ${user.name} (${update.email})`);
        console.log(`  Current Quota: ${user.total_leads_received} / ${currentPromised}`);
        console.log(`  Action: Adding +${update.add} leads...`);

        // 2. Apply Update
        const { error: updateError } = await supabase
            .from('users')
            .update({
                total_leads_promised: newPromised,
                is_active: true, // Ensure they are active
                plan_activation_time: new Date().toISOString() // Refresh activation time if needed
            })
            .eq('id', user.id);

        if (updateError) {
            console.error(`  ❌ Update Failed:`, updateError.message);
        } else {
            console.log(`  ✅ Success! New Promise: ${newPromised}`);
        }
        console.log('-----------------------------------');
    }
    console.log('=== BULK QUOTA CORRECTION COMPLETE ===');
})();
