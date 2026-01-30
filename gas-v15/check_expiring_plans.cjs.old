
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

async function checkExpiringPlans() {
    console.log("⏳ Checking for Plans Expiring Soon (Next 48 Hours)...");

    const now = new Date();
    const twoDaysLater = new Date(now.getTime() + 48 * 60 * 60 * 1000);

    console.log(`Checking range: ${now.toISOString()} to ${twoDaysLater.toISOString()}`);

    // Query Active Users expiring soon
    const { data: users, error } = await supabase
        .from('users')
        .select('id, name, email, plan_name, valid_until')
        .gt('valid_until', now.toISOString())
        .lte('valid_until', twoDaysLater.toISOString())
        .order('valid_until', { ascending: true });

    if (error) {
        console.error("❌ Error fetching users:", error);
        return;
    }

    if (!users || users.length === 0) {
        console.log("✅ No plans expiring in the next 48 hours.");
        return;
    }

    console.log(`\n⚠️ Queries Found: ${users.length} Users expiring soon.\n`);
    console.log("----------------------------------------------------------------");
    console.log(`| ${"User Name".padEnd(20)} | ${"Plan".padEnd(15)} | ${"Expires In".padEnd(15)} |`);
    console.log("----------------------------------------------------------------");

    users.forEach(u => {
        const expiryDate = new Date(u.valid_until);

        // Calculate remaining time
        const diffMs = expiryDate - now;
        const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
        const diffMins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

        const timeRemaining = `${diffHours}h ${diffMins}m`;

        console.log(`| ${u.name.padEnd(20)} | ${u.plan_name.padEnd(15)} | ${timeRemaining.padEnd(15)} |`);
    });
    console.log("----------------------------------------------------------------");
}

checkExpiringPlans();
