const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://vewqzsqddgmkslnuctvb.supabase.co';
const ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ1MzA0NjIsImV4cCI6MjA4MDEwNjQ2Mn0.g-e8YNzEy0Z5ul1RGAhBMDj41TtWGuNPEzZz4XEGPg4";

const supabase = createClient(SUPABASE_URL, ANON_KEY);

async function stopSystem() {
    console.log("🛑 INITIATING SYSTEM SHUTDOWN (Night Mode)...\n");

    // 1. Deactivate All Users
    const { error: userError, count } = await supabase
        .from('users')
        .update({ is_active: false })
        .neq('id', '00000000-0000-0000-0000-000000000000'); // Dummy filter to allow update all

    if (userError) {
        console.error("❌ Error stopping users:", userError.message);
    } else {
        console.log(`✅ All Users Marked INACTIVE (Delivery Paused).`);
    }

    // 2. Expire any lingering 'New' leads to prevent morning leaks
    // We fetch them first to count
    const { data: leads } = await supabase
        .from('leads')
        .select('id')
        .eq('status', 'New')
        .is('assigned_to', null);

    if (leads && leads.length > 0) {
        const { error: leadError } = await supabase
            .from('leads')
            .update({ status: 'Expired' })
            .eq('status', 'New')
            .is('assigned_to', null);

        if (leadError) {
            console.error("❌ Error expiring leads:", leadError.message);
        } else {
            console.log(`✅ ${leads.length} Unassigned Pending Leads marked EXPIRED.`);
        }
    } else {
        console.log("✅ No unassigned pending leads found.");
    }

    console.log("\n🌙 System is now OFF. No leads will be assigned.");
}

stopSystem();
