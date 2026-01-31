const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://vewqzsqddgmkslnuctvb.supabase.co';
const ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ1MzA0NjIsImV4cCI6MjA4MDEwNjQ2Mn0.g-e8YNzEy0Z5ul1RGAhBMDj41TtWGuNPEzZz4XEGPg4";
const supabase = createClient(SUPABASE_URL, ANON_KEY);

async function fixAllPlanQuotas() {
    console.log("📐 FINAL RE-CALCULATION OF QUOTAS (Including Replacements)...\n");

    // BASED ON SUBSCRIPTION.TSX
    const PLAN_RULES = {
        'starter': { total: 55 },         // 50 + 5
        'supervisor': { total: 115 },     // 105 + 10
        'manager': { total: 176 },        // 160 + 16 (Assumption: 160 + 16 repl)
        'weekly_boost': { total: 92 },    // 84 + 8
        'turbo_boost': { total: 108 }     // 98 + 10
    };

    const { data: users, error } = await supabase
        .from('users')
        .select('id, name, plan_name, total_leads_promised')
        .neq('plan_name', 'none')
        .order('plan_name');

    if (error) return console.error(error);

    for (const u of users) {
        // Handle weird cases
        const planKey = (u.plan_name || '').toLowerCase().trim();
        const rules = PLAN_RULES[planKey];

        if (!rules) continue;

        const currentLimit = u.total_leads_promised || 0;
        const targetLimit = rules.total;

        // UPGRADE IF LESS
        if (currentLimit < targetLimit) {
            console.log(`🔧 UPGRADING: ${u.name} (${u.plan_name})`);
            console.log(`   From ${currentLimit} -> ${targetLimit} (+Replacement)`);

            await supabase
                .from('users')
                .update({ total_leads_promised: targetLimit })
                .eq('id', u.id);
        } else {
            // If equal or more (e.g. Renewed), leave it.
            // console.log(`✅ OK: ${u.name} has ${currentLimit} (Min: ${targetLimit})`);
        }
    }
    console.log("\nDone.");
}

fixAllPlanQuotas();
