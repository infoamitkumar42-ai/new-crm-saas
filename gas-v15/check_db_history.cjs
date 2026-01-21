
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

async function checkHistory() {
    console.log("🕵️‍♂️ Checking for Audit Logs & User Fields...");

    // 1. Check Tables (Looking for logs)
    // Supabase usually exposes public tables. We can try to guess or select from information_schema if possible,
    // but a quicker way is just to check common names or inspect the 'users' row fully.

    // 2. Dump Rajinder's Row Fully
    const { data: users, error } = await supabase
        .from('users')
        .select('*')
        .ilike('name', '%Rajinder%')
        .limit(1);

    if (users && users.length > 0) {
        const u = users[0];
        console.log("\n📋 Full User Object Keys:");
        Object.keys(u).forEach(k => {
            if (k.includes('time') || k.includes('date') || k.includes('at') || k.includes('pause')) {
                console.log(`   - ${k}: ${u[k]}`);
            }
        });
    }

    // 3. Try to fetch from a potential 'audit_logs' or 'activity_logs' or 'logs' table
    const tablesToCheck = ['audit_logs', 'activity_logs', 'logs', 'user_logs', 'plan_history'];
    for (const table of tablesToCheck) {
        const { data, error } = await supabase.from(table).select('count', { count: 'exact', head: true });
        if (!error) {
            console.log(`\n✅ Found Table: '${table}'! Searching for Rajinder's history...`);
            // Try to find logs for this user
            if (users && users.length > 0) {
                const { data: logs } = await supabase
                    .from(table)
                    .select('*')
                    .or(`user_id.eq.${users[0].id},details.ilike.%Rajinder%`)
                    .order('created_at', { ascending: false })
                    .limit(5);
                console.log(logs);
            }
        } else {
            // console.log(`   Table '${table}' not found or accessible.`);
        }
    }
}

checkHistory();
