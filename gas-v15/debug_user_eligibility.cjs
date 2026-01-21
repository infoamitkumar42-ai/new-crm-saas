
const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

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

async function checkEligibility() {
    console.log("🔍 checking Eligibility (Simulation)...");

    // Fetch a few key users
    const { data: users, error } = await supabase
        .from('users')
        .select('*')
        .in('email', ['simransimmi983@gmail.com', 'rahulrai@example.com', 'navpreetkaur@example.com'])
        // Note: Actual emails might be different, so let's just checking active users generally
        .eq('is_active', true)
        .limit(10);

    if (error) { console.error("Error:", error); return; }

    const now = new Date();

    users.forEach(user => {
        console.log(`\n👤 User: ${user.name} (${user.email})`);

        // 1. Limit Check
        const leadsToday = user.leads_today || 0;
        const dailyLimit = user.daily_limit || 0;
        const pending = Math.max(0, dailyLimit - leadsToday);
        console.log(`   - Leads: ${leadsToday}/${dailyLimit} (Pending: ${pending})`);
        if (leadsToday >= dailyLimit) console.log("   ❌ LIMIT REACHED");

        // 2. Expiry Check (Webhook Logic)
        const validUntil = user.valid_until ? new Date(user.valid_until) : null;
        console.log(`   - Valid Until: ${user.valid_until} (${validUntil})`);
        if (!validUntil || validUntil < now) {
            console.log("   ❌ SUBSCRIPTION EXPIRED (Webhook will block)");
        } else {
            console.log("   ✅ SUBSCRIPTION VALID");
        }

        // 3. 30 Min Warmup Check
        if (user.plan_activation_time) {
            const activationTime = new Date(user.plan_activation_time);
            const waitTime = new Date(activationTime.getTime() + 30 * 60000); // +30 Minutes

            console.log(`   - Activation: ${user.plan_activation_time}`);
            console.log(`   - Wait Until: ${waitTime.toISOString()}`);

            if (now < waitTime) {
                const remainingMins = Math.ceil((waitTime.getTime() - now.getTime()) / 60000);
                console.log(`   ❌ WARMUP PERIOD (Wait ${remainingMins}m)`);
            } else {
                console.log("   ✅ WARMUP COMPLETE");
            }
        } else {
            console.log("   ✅ NO ACTIVATION TIME (Passed)");
        }

        // 4. Overall Pass/Fail
        if (validUntil && validUntil > now && (!user.plan_activation_time || new Date(user.plan_activation_time).getTime() + 1800000 < now.getTime()) && leadsToday < dailyLimit) {
            console.log("   🟢 RESULT: ELIGIBLE");
        } else {
            console.log("   🔴 RESULT: BLOCKED");
        }
    });
}

checkEligibility();
