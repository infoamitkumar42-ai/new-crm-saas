const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://vewqzsqddgmkslnuctvb.supabase.co';
const ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ1MzA0NjIsImV4cCI6MjA4MDEwNjQ2Mn0.g-e8YNzEy0Z5ul1RGAhBMDj41TtWGuNPEzZz4XEGPg4";
const supabase = createClient(SUPABASE_URL, ANON_KEY);

async function checkStatus() {
    console.log("🕵️ INVESTIGATING SAMAN & AJAY...\n");

    const names = ['%saman%', '%ajay%'];

    for (const n of names) {
        const { data: users, error } = await supabase.from('users').select('*').ilike('name', n);

        if (users) {
            users.forEach(u => {
                console.log(`User: ${u.name}`);
                console.log(`ID: ${u.id.substring(0, 8)}...`);
                console.log(`Status Switch (DB): ${u.is_online ? '🟢 ON' : '🔴 OFF'}`);
                console.log(`Plan Active: ${u.is_active}`);
                console.log(`Leads Today: ${u.leads_today} / ${u.daily_limit}`);
                console.log(`Last Active: ${u.last_active_at || 'Never'}`);
                console.log('---');
            });
        }
    }
}

checkStatus();
