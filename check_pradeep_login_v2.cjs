const { createClient } = require('@supabase/supabase-js');
const SUPABASE_URL = 'https://vewqzsqddgmkslnuctvb.supabase.co';
const ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ1MzA0NjIsImV4cCI6MjA4MDEwNjQ2Mn0.g-e8YNzEy0Z5ul1RGAhBMDj41TtWGuNPEzZz4XEGPg4";
const supabase = createClient(SUPABASE_URL, ANON_KEY);

async function checkPradeepLoginRetry() {
    console.log("🔍 Checking Last Login (Retry)...");

    const { data: user, error } = await supabase
        .from('users')
        .select('name, is_online, last_active_at, last_login, last_activity')
        .eq('email', 'pradeepleads@gmail.com')
        .single();

    if (error) { console.error(error); return; }

    console.log(`👤 User: ${user.name}`);
    console.log(`🟢 Online Status: ${user.is_online ? 'Yes' : 'No'}`);

    // Check all timestamps
    const times = {
        'last_active_at': user.last_active_at,
        'last_login': user.last_login,
        'last_activity': user.last_activity
    };

    let loggedInToday = false;
    const today = new Date();

    Object.entries(times).forEach(([key, val]) => {
        if (val) {
            const date = new Date(val);
            const timeStr = date.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });
            console.log(`🕒 ${key}: ${timeStr}`);

            if (date.getDate() === today.getDate() && date.getMonth() === today.getMonth()) {
                loggedInToday = true;
            }
        } else {
            console.log(`🕒 ${key}: NULL`);
        }
    });

    console.log(`\n📅 Logged In Today? ${loggedInToday ? 'YES ✅' : 'NO ❌'}`);
}

checkPradeepLoginRetry();
