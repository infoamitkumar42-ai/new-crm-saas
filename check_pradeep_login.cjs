const { createClient } = require('@supabase/supabase-js');

// Config
const SUPABASE_URL = 'https://vewqzsqddgmkslnuctvb.supabase.co';
const ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ1MzA0NjIsImV4cCI6MjA4MDEwNjQ2Mn0.g-e8YNzEy0Z5ul1RGAhBMDj41TtWGuNPEzZz4XEGPg4";

const supabase = createClient(SUPABASE_URL, ANON_KEY);

async function checkPradeepLogin() {
    console.log("🔍 Checking Last Login for Pradeep...");

    const { data: user, error } = await supabase
        .from('users')
        .select('name, last_active, is_online')
        .eq('email', 'pradeepleads@gmail.com')
        .single();

    if (error) { console.error(error); return; }

    if (!user) { console.log("User not found via public query."); return; }

    console.log(`👤 User: ${user.name}`);
    console.log(`🟢 Online Status: ${user.is_online ? 'Yes' : 'No'}`);

    if (user.last_active) {
        const lastLogin = new Date(user.last_active);
        const options = { timeZone: 'Asia/Kolkata', weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' };
        console.log(`🕒 Last Active: ${lastLogin.toLocaleString('en-IN', options)}`);

        // Check if today
        const today = new Date();
        const isToday = lastLogin.getDate() === today.getDate() &&
            lastLogin.getMonth() === today.getMonth() &&
            lastLogin.getFullYear() === today.getFullYear();

        console.log(`📅 Creating Login Today? ${isToday ? 'YES ✅' : 'NO ❌'}`);
    } else {
        console.log("🕒 Last Active: Never / Not Recorded");
    }
}

checkPradeepLogin();
