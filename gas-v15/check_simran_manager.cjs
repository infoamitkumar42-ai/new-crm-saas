
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

async function checkManagers() {
    console.log("🔍 Checking User Managers...");

    // Page Manager ID from previous step
    const PAGE_MANAGER_ID = '9dd68ace-a5a7-46d8-b677-3483b5bb0841'; // Himanshu Sharma

    // Check Users
    const emails = ['simransimmi983@gmail.com', 'rahulrai@example.com', 'navpreetkaur@example.com'];
    const { data: users, error } = await supabase
        .from('users')
        .select('*')
        .in('email', emails);

    if (error) { console.error("Error:", error); return; }

    users.forEach(u => {
        console.log(`\n👤 ${u.name} (${u.email})`);
        console.log(`   - User ID: ${u.id}`);
        console.log(`   - Manager ID: ${u.manager_id}`);

        // Simulation
        const isTeam = (u.manager_id === PAGE_MANAGER_ID) || (u.id === PAGE_MANAGER_ID);
        console.log(`   👉 Team Filter: ${isTeam ? "PASS" : "FAIL (Blocked by Manager Restriction)"}`);
    });

    // Check who is the manager
    const { data: manager } = await supabase.from('users').select('name, email').eq('id', PAGE_MANAGER_ID).single();
    if (manager) {
        console.log(`\n👑 Page Managed By: ${manager.name} (${manager.email})`);
    } else {
        console.log(`\n👑 Page Managed By: Unknown ID ${PAGE_MANAGER_ID}`);
    }
}

checkManagers();
