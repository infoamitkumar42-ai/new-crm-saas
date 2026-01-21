
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

async function checkLogs() {
    console.log("🔍 Checking User Logs...\n");

    // 1. Get User ID
    const email = 'simranrakhra970@gmail.com';
    const { data: user, error: uError } = await supabase.from('users').select('id, name').eq('email', email).single();

    if (uError || !user) { console.error("User not found"); return; }
    console.log(`👤 User: ${user.name} (${user.id})`);

    // 2. Fetch updated_at from Users table
    const { data: userData, error: uError2 } = await supabase
        .from('users')
        .select('updated_at')
        .eq('id', user.id)
        .single();

    if (userData && userData.updated_at) {
        console.log(`\n🕒 Last Profile Update: ${userData.updated_at}`);
        const date = new Date(userData.updated_at);
        console.log(`   👉 (Likely Pause Time): ${date.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}`);
    } else {
        console.log("\n❌ No 'updated_at' timestamp found.");
    }

    // 2. Fetch Logs (Try 'user_interaction_logs' first)
    // We look for any action related to 'status', 'update', or 'toggle'

    const { data: logs, error: lError } = await supabase
        .from('user_interaction_logs')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10);

    if (lError) {
        console.error("❌ Logs Error:", lError.message);
        // Fallback: Check if there is an 'audit_logs' table?
        return;
    }

    if (!logs || logs.length === 0) {
        console.log("❌ No logs found for this user.");
    } else {
        console.log(`📜 Found ${logs.length} Recent Logs:`);
        logs.forEach(log => {
            console.log(`   [${log.created_at || 'No Date'}] Action: ${log.action} - Details: ${JSON.stringify(log.details || log.metadata)}`);
        });
    }

    // 3. Check for specific "update" actions in DB triggers if any?
    // Unlikely to access from here.
}

checkLogs();
