const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://vewqzsqddgmkslnuctvb.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDUzMDQ2MiwiZXhwIjoyMDgwMTA2NDYyfQ.pAgMGN6MtKm1A3fsKr1GIt8-qmKYhwFjSt92L_6_7us';
const supabase = createClient(supabaseUrl, supabaseKey);

const PLAN_LIMITS = {
    'starter': 5,
    'supervisor': 7,
    'manager': 8,
    'weekly_boost': 12,
    'turbo_boost': 14
};

(async () => {
    console.log('=== FIXING CONFIGURATION GAPS ===');

    // 1. Fix Zero Limit Users (Excluding Amit/Admin)
    const { data: users, error } = await supabase
        .from('users')
        .select('*')
        .eq('is_active', true)
        .neq('plan_name', 'none')
        .neq('name', 'Amit (Admin)'); // Exclude Admin

    if (error) { console.error(error); return; }

    let fixedCount = 0;

    for (const u of users) {
        let updates = {};
        let needsUpdate = false;

        // Fix Team (If missing)
        if (!u.team_code) {
            console.log(`Fixing Team for ${u.name}... Setting to TEAMFIRE`);
            updates.team_code = 'TEAMFIRE';
            needsUpdate = true;
        }

        // Fix Daily Limit (If 0)
        if ((u.daily_limit || 0) === 0) {
            const planLimit = PLAN_LIMITS[u.plan_name] || 5;
            console.log(`Fixing Limit for ${u.name} (${u.plan_name})... Setting to ${planLimit}`);
            updates.daily_limit = planLimit;
            needsUpdate = true;
        }

        if (needsUpdate) {
            const { error: updateError } = await supabase
                .from('users')
                .update(updates)
                .eq('id', u.id);

            if (updateError) console.error(`❌ Failed to update ${u.name}: ${updateError.message}`);
            else {
                console.log(`✅ Updated ${u.name}`);
                fixedCount++;
            }
        }
    }

    console.log(`\nAudit & Fix Complete. Fixed ${fixedCount} users.`);
})();
