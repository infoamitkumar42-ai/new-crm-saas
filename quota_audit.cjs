const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://vewqzsqddgmkslnuctvb.supabase.co';
const ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ1MzA0NjIsImV4cCI6MjA4MDEwNjQ2Mn0.g-e8YNzEy0Z5ul1RGAhBMDj41TtWGuNPEzZz4XEGPg4";
const supabase = createClient(SUPABASE_URL, ANON_KEY);

async function dataUsageAudit() {
    console.log("⚖️  QUOTA vs RECEIVED AUDIT (Simulation) ⚖️\n");

    // Default Quotas (Estimated - NEED CONFIRMATION)
    const PLAN_QUOTAS = {
        'starter': 55,       // 50 + 5
        'supervisor': 110,   // Guessing 100 + 10?
        'weekly_boost': 80,  // Guessing
        'turbo_boost': 55,   // Same as starter?
        'manager': 1000      // unlimited-ish
    };

    const { data: users } = await supabase
        .from('users')
        .select('id, name, plan_name, total_leads_received, total_leads_promised, is_active')
        .neq('plan_name', 'none')
        .eq('is_active', true);

    console.log(`Name                 | Plan        | Used / Promised (DB) | Status Check`);
    console.log(`---------------------|-------------|----------------------|-------------`);

    for (const u of users) {
        // Determine Logic Source
        const dbPromise = u.total_leads_promised || 0;
        const defaultQuota = PLAN_QUOTAS[u.plan_name] || 0;

        // Use DB promise if set, else fallback
        const effectiveLimit = dbPromise > 0 ? dbPromise : defaultQuota;

        const used = u.total_leads_received || 0;
        const remaining = effectiveLimit - used;

        let status = "✅ OK";
        if (remaining <= 0) status = "🛑 SHOULD STOP";
        if (effectiveLimit === 0) status = "⚠️ NO LIMIT SET";

        console.log(
            `${u.name.slice(0, 19).padEnd(20)} | ` +
            `${u.plan_name.padEnd(11)} | ` +
            `${String(used).padEnd(4)} / ${String(effectiveLimit).padEnd(4)} (${String(dbPromise).padEnd(4)} DB)` +
            `    | ${status}`
        );
    }
}

dataUsageAudit();
