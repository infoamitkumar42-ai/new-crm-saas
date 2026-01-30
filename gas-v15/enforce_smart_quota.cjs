const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load Env
function loadEnv() {
    try {
        const potentialPaths = [
            path.resolve('.env'),
            path.join(__dirname, '..', '.env'), // If inside gas-v15
            'c:\\Users\\HP\\Downloads\\new-crm-saas\\.env'
        ];

        for (const p of potentialPaths) {
            if (fs.existsSync(p)) {
                // console.log('Loaded env from:', p);
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

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase Credentials');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// PLAN LIMITS (Per Payment)
const PLAN_LIMITS = {
    'starter': 55,
    'supervisor': 115,
    'manager': 176,
    'weekly_boost': 92,
    'turbo_boost': 108
};

async function enforceSmartQuota() {
    console.log('--- 🛡️ SMART QUOTA ENFORCEMENT STARTED ---');
    console.log('Policy: Stops ONLY when Quota is FULL. Ignores Date Expiry.\n');

    // 1. Fetch All Relevant Users (Active Or Recently Inactive)
    const { data: users, error } = await supabase
        .from('users')
        .select('id, name, email, plan_name, is_active, daily_limit, valid_until, total_leads_promised')
        .neq('plan_name', 'none')
        .not('plan_name', 'is', null);

    if (error) {
        console.error('Error fetching users:', error);
        return;
    }

    console.log(`Checking ${users.length} users...`);

    let activeCount = 0;
    let stoppedCount = 0;
    let reactivatedCount = 0;

    for (const user of users) {
        if (!user.plan_name) continue;

        // A. Calculate Total Quota
        let totalQuota = user.total_leads_promised || 0;

        // If not set manually, calculate from Payments
        if (!totalQuota || totalQuota === 0) {
            const { data: payments } = await supabase
                .from('payments')
                .select('id')
                .eq('user_id', user.id)
                .eq('status', 'captured');

            const payCount = payments ? payments.length : 1; // Default to 1 if no payment found but has plan
            const limit = PLAN_LIMITS[user.plan_name.toLowerCase()] || 0;
            totalQuota = limit * payCount;
        }

        // B. Calculate Used Leads
        const { count: used } = await supabase
            .from('leads')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', user.id);

        const leadsUsed = used || 0;
        const leadsRemaining = totalQuota - leadsUsed;

        // C. Enforcement Logic
        const isQuotaFinished = leadsRemaining <= 0;

        if (isQuotaFinished) {
            // STOP USER
            if (user.is_active || user.daily_limit > 0) {
                console.log(`🛑 STOPPING: ${user.name} (${user.plan_name})`);
                console.log(`   Usage: ${leadsUsed} / ${totalQuota} (Over Limit)`);

                await supabase.from('users').update({
                    is_active: false,
                    daily_limit: 0,
                    payment_status: 'inactive'
                }).eq('id', user.id);
                stoppedCount++;
            }
        } else {
            // KEEP/MAKE ACTIVE
            // Check if user is oddly stopped (Active=true but Limit=0) OR (Active=false but Quota Remaining)
            // Note: We only auto-activate if they were active recently or "stuck".
            // To be safe, we only fix "Stuck" users (Active=true, Limit=0) or (Expired Date).

            // Check Date Expiry
            const now = new Date();
            const validUntil = new Date(user.valid_until);
            const isDateExpired = validUntil < now;

            let needsUpdate = false;
            let updates = {};

            // 1. Fix Date (Extend if expired but quota remains)
            if (isDateExpired || !user.valid_until) {
                console.log(`🔄 EXTENDING DATE: ${user.name} (Quota Remaining: ${leadsRemaining})`);
                const future = new Date();
                future.setDate(future.getDate() + 30); // Add 30 days buffer
                updates.valid_until = future.toISOString();
                needsUpdate = true;
            }

            // 2. Fix Status (If Inactive/Limit 0 but Quota Remains)
            // Only force active if they are marked "active" but have 0 limit (The Harmandeep/Ruchi Case)
            // OR if they are marked inactive purely due to date (hard to detect, but we assume manual activation usually)

            if (user.is_active && user.daily_limit === 0) {
                console.log(`✅ REACTIVATING LIMIT: ${user.name}`);
                // Set default limit based on plan
                let defaultLimit = 0;
                if (user.plan_name.includes('starter')) defaultLimit = 5;
                if (user.plan_name.includes('weekly')) defaultLimit = 8;
                if (user.plan_name.includes('manager')) defaultLimit = 8;
                if (user.plan_name.includes('supervisor')) defaultLimit = 7;
                if (user.plan_name.includes('turbo')) defaultLimit = 12;

                updates.daily_limit = defaultLimit || 5;
                updates.payment_status = 'active';
                needsUpdate = true;
                reactivatedCount++;
            }

            if (needsUpdate) {
                await supabase.from('users').update(updates).eq('id', user.id);
            }
            activeCount++;
        }
    }

    console.log('\n--- REPORT ---');
    console.log(`Active Users (Quota Remaining): ${activeCount}`);
    console.log(`Stopped Users (Quota Full): ${stoppedCount}`);
    console.log(`Reactivated/Fixed Users: ${reactivatedCount}`);
    console.log('--- END ---');
}

enforceSmartQuota();
