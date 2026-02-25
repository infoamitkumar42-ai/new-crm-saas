
const fs = require('fs');
const path = require('path');
const https = require('https');
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
const projectRef = 'vewqzsqddgmkslnuctvb'; // Verified Project ID
const notifyUrl = `https://${projectRef}.supabase.co/functions/v1/send-push-notification`;

const supabase = createClient(supabaseUrl, supabaseKey);

async function sendNotifications() {
    console.log("🔔 Preparing to send lead notifications...");

    // 1. Get Users with leads today
    const { data: users, error: uErr } = await supabase
        .from('users')
        .select('id, name, leads_today')
        .gt('leads_today', 0)
        .eq('is_active', true);

    if (uErr) {
        console.error("❌ Error fetching users:", uErr);
        return;
    }

    console.log(`📋 Found ${users.length} users with new leads.`);

    let sentCount = 0;

    for (const u of users) {
        console.log(`   - Notifying ${u.name} (${u.leads_today} leads)...`);

        await new Promise((resolve) => {
            const payload = JSON.stringify({
                userId: u.id,
                title: "🔥 Leads Assigned!",
                body: `You have received ${u.leads_today} new leads today. Check your dashboard immediately!`
            });

            const options = {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${supabaseKey}`,
                    'Content-Type': 'application/json'
                }
            };

            const req = https.request(notifyUrl, options, (res) => {
                let data = '';
                res.on('data', chunk => data += chunk);
                res.on('end', () => {
                    if (res.statusCode === 200) {
                        try {
                            const result = JSON.parse(data);
                            if (result.success || result.sent > 0) {
                                console.log(`     ✅ Sent.`);
                                sentCount++;
                            } else {
                                console.log(`     ⚠️ No devices registered.`);
                            }
                        } catch (e) { console.log(`     ⚠️ Invalid response.`); }
                    } else {
                        console.log(`     ❌ Failed: ${res.statusCode}`);
                    }
                    resolve();
                });
            });

            req.on('error', (e) => {
                console.error(`     ❌ Error: ${e.message}`);
                resolve();
            });

            req.write(payload);
            req.end();
        });
    }

    console.log(`\n🎉 Process Complete! Notifications sent to ${sentCount} users.`);
}

sendNotifications();
