
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

async function checkPage() {
    console.log("🔍 Checking Connected Pages...");

    const { data: pages, error } = await supabase
        .from('connected_pages')
        .select('*');

    if (error) { console.error("Error:", error); return; }

    pages.forEach(p => {
        console.log(`\n📄 Page: ${p.page_name} (ID: ${p.page_id})`);
        console.log(`   - Is Active: ${p.is_active}`);
        console.log(`   - Manager ID: ${p.manager_id ? p.manager_id : 'NULL (Global)'}`);
    });
}

checkPage();
