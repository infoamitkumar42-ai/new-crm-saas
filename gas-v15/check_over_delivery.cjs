
const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// 1. Setup Supabase
function loadEnv() {
    try {
        const paths = [
            path.join(process.cwd(), '.env'),
            path.join('C:', 'Users', 'HP', 'Downloads', 'new-crm-saas', '.env')
        ];
        for (const p of paths) {
            if (fs.existsSync(p)) {
                const envContent = fs.readFileSync(p, 'utf8');
                const env = {};
                envContent.split('\n').forEach(line => {
                    const [key, ...parts] = line.split('=');
                    if (key && parts.length > 0) env[key.trim()] = parts.join('=').trim().replace(/^["']|["']$/g, '');
                });
                return env;
            }
        }
    } catch (e) { return process.env; }
    return {};
}

const env = loadEnv();
const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL || env.SUPABASE_URL || env.VITE_SUPABASE_URL;
const supabaseKey = env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// Confirmed from Subscription.tsx
const PLAN_DURATION_MAP = {
    'starter': 10,
    'supervisor': 15,
    'manager': 20,
    'weekly_boost': 7,
    'turbo_boost': 7
};

const PLAN_LIMIT_MAP = {
    'starter': 5,
    'supervisor': 7,
    'manager': 8,
    'weekly_boost': 12,
    'turbo_boost': 14
};

async function checkOverDelivery() {
    console.log("📊 Analyzing Lead Delivery vs. Entitlement...");

    const now = new Date(); // Current Time

    // 1. Get Active Users
    const { data: users, error } = await supabase
        .from('users')
        .select('id, name, email, plan_name, daily_limit, valid_until, plan_activation_time')
        .gt('valid_until', now.toISOString());

    if (error || !users) {
        console.error("❌ Error fetching users:", error);
        return;
    }

    console.log(`\n👥 Active Users Found: ${users.length}\n`);
    console.log("---------------------------------------------------------------------------------------------------------");
    console.log(`| ${"User Name".padEnd(20)} | ${"Plan".padEnd(12)} | ${"Active Days".padEnd(11)} | ${"Expected".padEnd(8)} | ${"Given".padEnd(5)} | ${"Status".padEnd(10)} |`);
    console.log("---------------------------------------------------------------------------------------------------------");

    let overDeliveredUsers = 0;

    for (const u of users) {
        const planKey = (u.plan_name || '').toLowerCase();
        const duration = PLAN_DURATION_MAP[planKey] || 30; // Default to 30 if unknown
        const dailyLimit = u.daily_limit || PLAN_LIMIT_MAP[planKey] || 0;

        // Determine Start Date
        // If plan_activation_time (PAT) is present, use it.
        // If PAT is missing (legacy), try derive from valid_until: valid_until - duration
        let startDate = null;
        if (u.plan_activation_time) {
            startDate = new Date(u.plan_activation_time);
        } else {
            const validUntil = new Date(u.valid_until);
            startDate = new Date(validUntil.getTime() - (duration * 24 * 60 * 60 * 1000));
        }

        // Calculate Days Active So Far
        // If startDate is in future (impossible active user?), clamp to 0
        // Use Math.ceil for partial days (e.g. if started yesterday noon and now is noon, that's exactly 1 day. If now is evening, it's 2nd day running)
        // Actually, entitlement accumulates daily.
        // Let's assume: (Now - Start) / (24h). 
        // Example: Started Jan 1 10 AM. Now Jan 1 11 AM. 1 hour active. Entitled to 1 day's quota? Yes.
        // Started Jan 1. Now Jan 2 11 AM. 25 hours active. Entitled to 2 day's quota.
        const msActive = now.getTime() - startDate.getTime();
        const daysActive = Math.max(1, Math.ceil(msActive / (24 * 60 * 60 * 1000)));

        // Cap Active Days at Plan Duration (if valid_until is accidentally far future)
        const effectiveDays = Math.min(daysActive, duration);

        const expectedLeads = effectiveDays * dailyLimit;

        // Count Actual Leads Given Since Start Date
        // We query leads table
        const { count: actualGiven, error: lErr } = await supabase
            .from('leads')
            .select('*', { count: 'exact', head: true })
            .eq('assigned_to', u.id)
            .gte('created_at', startDate.toISOString()); // leads created AFTER plan started

        if (lErr) {
            console.error(`Error counting leads for ${u.name}`);
            continue;
        }

        const diff = actualGiven - expectedLeads;
        const status = diff > 0 ? `+${diff} (OVER)` : `${diff} (OK)`;

        if (diff > 0) overDeliveredUsers++;

        console.log(`| ${u.name.padEnd(20).slice(0, 20)} | ${planKey.padEnd(12)} | ${effectiveDays.toString().padEnd(11)} | ${expectedLeads.toString().padEnd(8)} | ${actualGiven.toString().padEnd(5)} | ${status.padEnd(10)} |`);
    }

    console.log("---------------------------------------------------------------------------------------------------------");
    console.log(`\n⚠️ Total Over-Delivered Users: ${overDeliveredUsers}`);
}

checkOverDelivery();
