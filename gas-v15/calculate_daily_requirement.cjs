
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

async function calculateRequirement() {
    console.log("📊 Calculating Daily Lead Requirement...");

    // Get Active Users
    const now = new Date().toISOString();

    // Logic: Check valid_until ONLY (subscription_status column doesn't exist)
    const { data: users, error } = await supabase
        .from('users')
        .select('id, name, email, plan_name, daily_limit, valid_until')
        .gt('valid_until', now);

    if (error) {
        console.error("❌ Error fetching users:", error);
        return;
    }

    if (!users || users.length === 0) {
        console.log("⚠️ No active users found.");
        return;
    }

    let totalDailyNeed = 0;
    const planBreakdown = {};

    console.log(`\n👥 Found ${users.length} Active Users.`);
    console.log("------------------------------------------------");
    console.log(`| ${"User Name".padEnd(25)} | ${"Plan".padEnd(15)} | ${"Daily Limit"} |`);
    console.log("------------------------------------------------");

    users.forEach(u => {
        const limit = u.daily_limit || 0;
        totalDailyNeed += limit;

        // Breakdown stats
        const plan = u.plan_name || 'Unknown';
        if (!planBreakdown[plan]) planBreakdown[plan] = { users: 0, leads: 0 };
        planBreakdown[plan].users++;
        planBreakdown[plan].leads += limit;

        console.log(`| ${u.name.padEnd(25)} | ${plan.padEnd(15)} | ${limit.toString().padEnd(11)} |`);
    });

    console.log("------------------------------------------------");
    console.log(`\n📌 Summary by Plan:`);
    Object.keys(planBreakdown).forEach(p => {
        const stats = planBreakdown[p];
        console.log(`   - ${p.padEnd(15)}: ${stats.users} Users -> ${stats.leads} Leads/Day`);
    });

    console.log(`\n🚀 TOTAL LEADS REQUIRED DAILY: ${totalDailyNeed}`);
    console.log("------------------------------------------------");
}

calculateRequirement();
