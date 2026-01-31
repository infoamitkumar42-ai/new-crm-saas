const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://vewqzsqddgmkslnuctvb.supabase.co';
const ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ1MzA0NjIsImV4cCI6MjA4MDEwNjQ2Mn0.g-e8YNzEy0Z5ul1RGAhBMDj41TtWGuNPEzZz4XEGPg4";
const supabase = createClient(SUPABASE_URL, ANON_KEY);

async function fixPlanQuotas() {
    console.log("📐 RE-CALCULATING & FIXING PLAN QUOTAS...\n");

    // DEFINING THE LAW (The Formula)
    const PLAN_RULES = {
        'starter': { base: 50, replace: 5, total: 55 },      // 5 daily * 10 days
        'supervisor': { base: 100, replace: 15, total: 115 }, // 10 daily * 10 days (Assuming 15 repl)
        'weekly_boost': { base: 84, replace: 0, total: 84 },  // 12 daily * 7 days ?? (Need Conf)
        'turbo_boost': { base: 98, replace: 0, total: 98 },   // ??
        'manager': { base: 160, replace: 0, total: 160 }
    };

    // Users to Fix
    const { data: users, error } = await supabase
        .from('users')
        .select('id, name, plan_name, total_leads_promised, total_leads_received')
        .neq('plan_name', 'none')
        .order('plan_name');

    if (error) return console.error(error);

    for (const u of users) {
        const rules = PLAN_RULES[u.plan_name];

        // Skip unknown plans or custom users (like admins)
        if (!rules) continue;

        const currentLimit = u.total_leads_promised || 0;
        const targetLimit = rules.total;

        // CHECK: Calculation
        // If user already has MORE leads than limit (e.g. Renewed), we should be careful.
        // User Logic: "Renew kiya to double hona chahiye" -> This script won't know if they renewed.
        // It simply enforces the single plan limit.

        // SAFE GUARDIAN:
        // Only update if currentLimit is 0 or NULL or clearly default/wrong.
        // If currentLimit is 110 (Active renewal?), don't downgrade to 55.

        if (currentLimit === 0 || currentLimit === null) {
            console.log(`🔧 FIXING: ${u.name} (${u.plan_name}) -> Setting Limit to ${targetLimit}`);

            await supabase
                .from('users')
                .update({ total_leads_promised: targetLimit })
                .eq('id', u.id);
        }
        else if (currentLimit !== targetLimit) {
            // Log discrepancy but don't auto-overwrite renewals blindly
            const isMultiple = currentLimit % targetLimit === 0;
            const status = isMultiple ? "✅ RENEWED (Multiple)" : "⚠️ MISMATCH";

            console.log(`ℹ️  ${u.name.padEnd(20)} | Plan: ${u.plan_name.padEnd(12)} | Has: ${currentLimit} | Rule: ${targetLimit} | ${status}`);

            // If MISMATCH (e.g. 50 vs 55), Upgrade them.
            if (u.plan_name === 'starter' && currentLimit === 50) {
                console.log(`   -> UPGRADING to 55 (Adding Replacement Quota)`);
                await supabase.from('users').update({ total_leads_promised: 55 }).eq('id', u.id);
            }
        }
    }
    console.log("\nDone.");
}

fixPlanQuotas();
