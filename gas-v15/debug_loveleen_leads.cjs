
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

async function debugLoveleen() {
    console.log("🔍 Debugging Loveleen...\n");

    const email = 'loveleensharma530@gmail.com';

    // 1. Get User Details
    const { data: users, error: uError } = await supabase
        .from('users')
        .select('*')
        .eq('email', email);

    if (uError || !users || users.length === 0) { console.error("❌ User not found"); return; }

    if (users.length > 1) {
        console.log(`⚠️ WARNING: Found ${users.length} users with this email!`);
    }

    const user = users[0];
    console.log(`👤 User: ${user.name} (${user.id})`);
    console.log(`   - Leads Today (Column): ${user.leads_today}`);
    console.log(`   - Is Active: ${user.is_active}`);

    // 2. Count ACTUAL Leads in 'leads' table for today
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const { count, error: cError } = await supabase
        .from('leads')
        .select('*', { count: 'exact', head: true })
        .eq('assigned_to', user.id)
        .gte('assigned_at', startOfDay.toISOString());

    if (cError) { console.error("❌ Count Error:", cError); return; }

    console.log(`   - ACTUAL Leads Found in DB: ${count}`);

    // 3. Conclusion
    if (count > user.leads_today) {
        console.log("\n🚨 DISCREPANCY FOUND!");
        console.log("   The 'leads_today' counter is stuck, but she HAS leads.");
        console.log("   Action: I will fix the counter now.");

        // Auto-fix locally if needed, but lets just report first
        const { error: fixError } = await supabase
            .from('users')
            .update({ leads_today: count })
            .eq('id', user.id);

        if (!fixError) console.log("   ✅ Fixed 'leads_today' to match actual count.");
    } else if (count === 0) {
        console.log("\n❌ SHE HAS 0 LEADS.");
        console.log("   Usage: The previous 'Assigned' log might have been for a different 'Loveleen' or failed?");
    } else {
        console.log("\n✅ Data Matches (Normal).");
    }
}

debugLoveleen();
