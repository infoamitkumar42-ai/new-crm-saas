const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://vewqzsqddgmkslnuctvb.supabase.co';
const ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ1MzA0NjIsImV4cCI6MjA4MDEwNjQ2Mn0.g-e8YNzEy0Z5ul1RGAhBMDj41TtWGuNPEzZz4XEGPg4";
const supabase = createClient(SUPABASE_URL, ANON_KEY);

async function verifyPausedUsersAreOffline() {
    console.log("🔍 VERIFYING ALL PAUSED USERS ARE OFFLINE...\n");

    // Check users who have is_active = false (they manually PAUSED)
    const { data: pausedUsers } = await supabase
        .from('users')
        .select('name, is_active, is_online, payment_status, updated_at')
        .eq('is_active', false)
        .eq('payment_status', 'active'); // Only paid users

    if (!pausedUsers || pausedUsers.length === 0) {
        console.log("✅ No PAID users have manually PAUSED.");
        return;
    }

    console.log(`Found ${pausedUsers.length} PAID users who PAUSED:\n`);

    let allCorrect = true;
    pausedUsers.forEach(u => {
        const status = u.is_online ? '❌ ONLINE (WRONG!)' : '✅ OFFLINE (Correct)';
        const updateTime = new Date(u.updated_at).toLocaleTimeString();
        console.log(`${u.name.padEnd(20)} | ${status} | Last Update: ${updateTime}`);
        if (u.is_online) allCorrect = false;
    });

    if (allCorrect) {
        console.log(`\n✅ ALL PAUSED users are correctly OFFLINE!`);
    } else {
        console.log(`\n⚠️ Some PAUSED users are still ONLINE - fixing...`);
        await supabase.from('users').update({ is_online: false }).eq('is_active', false);
        console.log(`✅ Fixed!`);
    }
}

verifyPausedUsersAreOffline();
