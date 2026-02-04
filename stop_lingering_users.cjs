const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://vewqzsqddgmkslnuctvb.supabase.co';
const ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ1MzA0NjIsImV4cCI6MjA4MDEwNjQ2Mn0.g-e8YNzEy0Z5ul1RGAhBMDj41TtWGuNPEzZz4XEGPg4";

const supabase = createClient(SUPABASE_URL, ANON_KEY);

async function forceStop() {
    console.log("🔒 FORCE STOPPING LINGERING USERS...\n");

    const emailsToStop = [
        'ravenjeetkaur@gmail.com',
        'dineshmonga22@gmail.com',
        'priyajotgoyal@gmail.com'
    ];

    for (const email of emailsToStop) {
        const { error } = await supabase
            .from('users')
            .update({ is_active: false })
            .eq('email', email);

        if (error) {
            console.error(`❌ Failed to stop ${email}: ${error.message}`);
        } else {
            console.log(`✅ Stopped: ${email}`);
        }
    }

    console.log("\nRe-verifying global status...");
}

forceStop();
