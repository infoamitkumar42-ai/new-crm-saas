const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://vewqzsqddgmkslnuctvb.supabase.co';
const ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ1MzA0NjIsImV4cCI6MjA4MDEwNjQ2Mn0.g-e8YNzEy0Z5ul1RGAhBMDj41TtWGuNPEzZz4XEGPg4";
const supabase = createClient(SUPABASE_URL, ANON_KEY);

async function fixWronglyStoppedUsers() {
    console.log("🚑 EMERGENCY FIX: Checking for wrongly stopped users...");

    const targetNames = ['Simran', 'Himanshu Sharma', 'Raveena'];
    const todayStr = '2026-01-31';

    // 1. Fetch ALL users with these names
    const { data: users, error } = await supabase
        .from('users')
        .select('id, name, valid_until, is_active, plan_name')
        .in('name', targetNames);

    if (error) return console.error(error);

    console.log(`Found ${users.length} users matching names.`);

    for (const u of users) {
        if (!u.valid_until) continue;

        const validDate = new Date(u.valid_until).toISOString().split('T')[0];

        // LOGIC: If Date is in FUTURE (> Today), and they are STOPPED, turn them ON.
        if (validDate > todayStr) {
            if (!u.is_active) {
                console.log(`💡 RESTORING: ${u.name} (Plan Valid till ${u.valid_until}). Was wrongly stopped.`);
                await supabase.from('users').update({ is_active: true }).eq('id', u.id);
            } else {
                console.log(`✅ SAFE: ${u.name} is Active and Valid.`);
            }
        }
        // LOGIC: If Date is PAST or TODAY (<= Today), Keep STOPPED.
        else {
            console.log(`🛑 CORRECTLY STOPPED: ${u.name} (Expired on ${u.valid_until}).`);
            if (u.is_active) {
                // Ensure stopped if missed
                await supabase.from('users').update({ is_active: false }).eq('id', u.id);
            }
        }
    }
}

fixWronglyStoppedUsers();
