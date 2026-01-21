
const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// Hardcoded paths for reliability
const envPath = 'C:\\Users\\HP\\Downloads\\new-crm-saas\\.env';
const envContent = fs.readFileSync(envPath, 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
    const [key, ...parts] = line.split('=');
    if (key && parts.length > 0) env[key.trim()] = parts.join('=').trim().replace(/^["']|["']$/g, '');
});

const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL || env.SUPABASE_URL || env.VITE_SUPABASE_URL;
const supabaseKey = env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkUser() {
    console.log("🔍 Checking User Status...\n");

    // Check specific email
    const email = 'simranrakhra970@gmail.com';

    const { data: user, error } = await supabase
        .from('users')
        .select('*')
        .eq('email', email)
        .single();

    if (error || !user) {
        console.error(`❌ User not found or Error: ${error ? error.message : "No Data"}`);
        return;
    }

    console.log(`👤 User: ${user.name}`);
    console.log(`📧 Email: ${user.email}`);
    console.log(`📊 Leads Today: ${user.leads_today} / ${user.daily_limit}`);
    console.log(`✅ Active (Toggle): ${user.is_active} (If false, it was manually turned off or auto-off due to expiry)`);
    console.log(`📅 Plan Name: ${user.plan_name}`);
    console.log(`⏳ Valid Until: ${user.valid_until}`);
    console.log(`🕒 Activation Time: ${user.plan_activation_time}`);
    console.log(`💳 Payment Pending: ${user.is_plan_pending}`);

    // Analysis
    const now = new Date();
    const validUntil = user.valid_until ? new Date(user.valid_until) : null;

    console.log("\n🕵️ DIAGNOSIS:");
    if (!validUntil || validUntil < now) {
        console.log("   ❌ REASON: Plan Expired. (Payment Needed)");
    } else if (user.is_active === false) {
        console.log("   ❌ REASON: Manually Paused (Toggle OFF). Plan is valid, but User/Admin turned it off.");
    } else if (user.is_plan_pending === true) {
        console.log("   ❌ REASON: Payment Stuck (Pending).");
    } else {
        console.log("   ✅ User looks OK relative to Plan. If inactive, it's just the toggle.");
    }
}

checkUser();
