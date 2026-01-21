const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// Helper to load .env.local
function loadEnv() {
    try {
        const paths = [
            path.join(process.cwd(), '.env'),
            path.join(process.cwd(), '.env.local'),
            path.join(__dirname, '..', '.env'),
            path.join(__dirname, '..', '.env.local'),
            path.join('C:', 'Users', 'HP', 'Downloads', 'new-crm-saas', '.env'),
            path.join('C:', 'Users', 'HP', 'Downloads', 'new-crm-saas', '.env.local')
        ];

        for (const p of paths) {
            if (fs.existsSync(p)) {
                console.log(`✅ Found env file at: ${p}`);
                const envContent = fs.readFileSync(p, 'utf8');
                const env = {};
                envContent.split('\n').forEach(line => {
                    const [key, ...parts] = line.split('=');
                    if (key && parts.length > 0) {
                        const value = parts.join('=').trim().replace(/^["']|["']$/g, '');
                        env[key.trim()] = value;
                    }
                });
                return env;
            }
        }
        console.log("⚠️ Could not find .env files in common locations");
        return {};
    } catch (e) {
        console.error("Error loading env:", e);
        return process.env;
    }
}

const env = loadEnv();
const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL || env.SUPABASE_URL || env.VITE_SUPABASE_URL;
const supabaseKey = env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error("❌ Credentials missing in .env.local");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkDistribution() {
    console.log("📊 Checking Today's Lead Distribution...");

    // Get start of today (IST)
    const now = new Date();
    // Adjust to IST 00:00:00
    // IST is UTC+5:30. 
    // If we want leads from "Today IST", we calculate the timestamp.
    const istOffset = 5.5 * 60 * 60 * 1000;
    const istNow = new Date(now.getTime() + istOffset);
    istNow.setUTCHours(0, 0, 0, 0);
    // Convert back to UTC ISO string for query
    const startOfDay = new Date(istNow.getTime() - istOffset).toISOString();

    console.log(`📅 Since: ${startOfDay} (UTC equivalent of Today 00:00 IST)`);

    // 1. Check GLOBAL Pending Backlog
    const { count: pendingBacklog, error: backlogError } = await supabase
        .from('leads')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'Night_Backlog');

    console.log(`\n🌙 GLOBAL Pending Night Backlog: ${pendingBacklog} (Should be processed at 10 AM)`);

    // 2. Analyze Today's Assigned Leads (Are they fresh or from night?)
    // Fetch leads assigned today
    const { data: leads, error } = await supabase
        .from('leads')
        .select('created_at, status, assigned_to')
        .gte('created_at', startOfDay)
        .not('assigned_to', 'is', null);

    const userIds = new Set();
    const distributionMap = {};

    if (leads) {
        let nightLeadsProcessed = 0;
        let freshLeads = 0;

        leads.forEach(l => {
            if (l.assigned_to) {
                userIds.add(l.assigned_to);
                distributionMap[l.assigned_to] = (distributionMap[l.assigned_to] || 0) + 1;
            }

            const date = new Date(l.created_at);
            // IST Hour
            const istHour = new Date(date.getTime() + (5.5 * 60 * 60 * 1000)).getUTCHours();

            // Night is 10 PM (22) to 8 AM (8)
            if (istHour >= 22 || istHour < 8) {
                nightLeadsProcessed++;
            } else {
                freshLeads++;
            }
        });

        console.log(`📋 Today's Assigned Analysis:`);
        console.log(`   - Total Assigned Today: ${leads.length}`);
        console.log(`   - Fresh Leads (8 AM+): ${freshLeads}`);
        console.log(`   - Night Leads (Processed Early?): ${nightLeadsProcessed}`);
    }

    // Fetch User Names
    const { data: users } = await supabase
        .from('users')
        .select('id, name, email')
        .in('id', Array.from(userIds));

    const userMap = {};
    if (users) {
        users.forEach(u => userMap[u.id] = u.name || u.email);
    }

    console.log("\n📊 Distribution by User:");
    Object.keys(distributionMap).forEach(userId => {
        const name = userMap[userId] || `Unknown (${userId})`;
        const count = distributionMap[userId];
        console.log(`   - ${name.padEnd(25)}: ${count}`);
    });
}

checkDistribution();
