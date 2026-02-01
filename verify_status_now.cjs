const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://vewqzsqddgmkslnuctvb.supabase.co';
const ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ1MzA0NjIsImV4cCI6MjA4MDEwNjQ2Mn0.g-e8YNzEy0Z5ul1RGAhBMDj41TtWGuNPEzZz4XEGPg4";
const supabase = createClient(SUPABASE_URL, ANON_KEY);

async function verifyStatus() {
    console.log("🕵️ VERIFYING CURRENT STATUS of Users who got leads today...\n");

    const namesToCheck = ['Loveleen kaur', 'Prabhjot kaur', 'Simran'];

    const { data: users, error } = await supabase
        .from('users')
        .select('name, is_online, last_active_at, leads_today')
        .in('name', namesToCheck);

    if (error) return console.error(error);

    console.log(`Name                 | Online?| Last Active      | Today Leads`);
    console.log(`---------------------|--------|------------------|------------`);

    for (const u of users) {
        const time = u.last_active_at ? new Date(u.last_active_at).toLocaleTimeString('en-IN') : 'N/A';
        const status = u.is_online ? "🟢 ON" : "🔴 OFF";
        console.log(`${u.name.padEnd(20)} | ${status.padEnd(6)} | ${time.padEnd(16)} | ${u.leads_today}`);
    }
}

verifyStatus();
