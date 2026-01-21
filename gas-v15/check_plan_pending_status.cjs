
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

if (!supabaseUrl || !supabaseKey) {
    console.error("❌ Missing Supabase Credentials in .env");
    console.error(`URL: ${supabaseUrl ? 'Found' : 'Missing'}`);
    console.error(`Key: ${supabaseKey ? 'Found' : 'Missing'}`);
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkStatus() {
    console.log("🔍 Checking 'is_plan_pending' for users...");

    // Check Simran specifically
    const emails = ['simransimmi983@gmail.com', 'rahulrai@gmail.com', 'navpreetkaur@example.com'];

    const { data: users, error } = await supabase
        .from('users')
        .select('name, email, is_plan_pending, is_active, plan_name')
        .in('email', emails);

    if (error) { console.error("Error:", error); return; }

    users.forEach(u => {
        console.log(`\n👤 ${u.name} (${u.email})`);
        console.log(`   - is_plan_pending: ${u.is_plan_pending} (${typeof u.is_plan_pending})`);
        console.log(`   - is_active: ${u.is_active}`);

        let willWebhookAccept = false;

        // Logic from Webhook: .or('is_plan_pending.is.null,is_plan_pending.eq.false');
        if (u.is_plan_pending === null || u.is_plan_pending === false) {
            willWebhookAccept = true;
        }

        console.log(`   👉 Webhook Filter: ${willWebhookAccept ? "PASS" : "FAIL (BLOCKED)"}`);
    });
}

checkStatus();
