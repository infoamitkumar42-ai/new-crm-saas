const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://vewqzsqddgmkslnuctvb.supabase.co';
const ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ1MzA0NjIsImV4cCI6MjA4MDEwNjQ2Mn0.g-e8YNzEy0Z5ul1RGAhBMDj41TtWGuNPEzZz4XEGPg4";
const supabase = createClient(SUPABASE_URL, ANON_KEY);

async function checkRealOnline() {
    console.log("🕵️ CHECKING ALL USERS WITH 'is_online' = TRUE (Indiscriminate)...\n");

    const { data: users, error } = await supabase
        .from('users')
        .select('id, name, is_online, is_active, plan_name, leads_today')
        .eq('is_online', true);

    if (error) return console.error(error);

    console.log(`Checking DB Time: ${new Date().toLocaleTimeString()}`);
    console.log(`Found ${users.length} Online Users in DB:\n`);

    console.log(`Name                 | Active Plan? | Plan Name      | ID Prefix`);
    console.log(`---------------------|--------------|----------------|----------`);

    for (const u of users) {
        console.log(`${u.name.padEnd(20)} | ${u.is_active ? 'YES' : 'NO '}        | ${u.plan_name.padEnd(14)} | ${u.id.substring(0, 8)}`);
    }

    // Check Saman Specifically
    console.log("\n🕵️ CHECKING SAMAN SPECIFICALLY (All Variants)...");
    const { data: samans } = await supabase.from('users').select('*').ilike('name', '%saman%');

    if (samans) {
        for (const s of samans) {
            const status = s.is_online ? "🟢 ON" : "🔴 OFF";
            console.log(`- ${s.name} (${s.id.substring(0, 8)}): ${status} | Plan Active: ${s.is_active}`);
        }
    }
}

checkRealOnline();
