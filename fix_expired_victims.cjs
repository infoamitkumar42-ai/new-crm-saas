const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const supabaseUrl = 'https://vewqzsqddgmkslnuctvb.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDUzMDQ2MiwiZXhwIjoyMDgwMTA2NDYyfQ.pAgMGN6MtKm1A3fsKr1GIt8-qmKYhwFjSt92L_6_7us';
const supabase = createClient(supabaseUrl, supabaseKey);

(async () => {
    console.log('=== FIXING 11 EXPIRED VICTIMS ===');

    let victims = [];
    try {
        victims = JSON.parse(fs.readFileSync('c:\\Users\\HP\\Downloads\\new-crm-saas\\expired_victims.json', 'utf8'));
    } catch (e) {
        console.error('Could not read expired_victims.json');
        return;
    }

    const newValidUntil = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(); // +7 Days

    console.log(`Extending validity to: ${newValidUntil}`);

    for (const v of victims) {
        process.stdout.write(`Fixing ${v.name} (${v.email})... `);

        const { error } = await supabase
            .from('users')
            .update({
                valid_until: newValidUntil,
                is_active: true
            })
            .eq('email', v.email);

        if (error) {
            console.log(`❌ Failed: ${error.message}`);
        } else {
            console.log(`✅ Success`);
        }
    }

    console.log('\nAll 11 users have been processed.');
})();
