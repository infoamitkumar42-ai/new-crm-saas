
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

async function checkSamanLeads() {
    console.log("🕵️ Checking specific leads from Screenshot...");

    const names = ['Sukhbir Singh', 'Jugraj Virk', '...jaspreet kaur'];

    const { data: leads, error } = await supabase
        .from('leads')
        .select('id, name, created_at, status, assigned_to, note:notes')
        .in('name', names);

    if (error) { console.error(error); return; }

    console.log("\nFound Leads Details:");
    leads.forEach(l => {
        const date = new Date(l.created_at);
        console.log(`   - Name: ${l.name}`);
        console.log(`     Created At: ${date.toLocaleString()} (Day: ${date.getDate()})`);
        console.log(`     Status: ${l.status}`);
        console.log(`     Notes: ${l.note || 'None'}`);
        console.log("-----------------------------------------");
    });
}

checkSamanLeads();
