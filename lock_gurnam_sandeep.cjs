const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://vewqzsqddgmkslnuctvb.supabase.co';
const ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ1MzA0NjIsImV4cCI6MjA4MDEwNjQ2Mn0.g-e8YNzEy0Z5ul1RGAhBMDj41TtWGuNPEzZz4XEGPg4";
const supabase = createClient(SUPABASE_URL, ANON_KEY);

const TARGET_IDS = [
    'd0a31bea-8a57-4584-a119-5b8e11140dbb', // Gurnam
    '2c905da5-b711-4a9c-9045-488719248bb1'  // Sandeep
];

async function lockLimits() {
    console.log("🔒 LOCKING LIMITS FOR GURNAM & SANDEEP...\n");

    const { data: users } = await supabase.from('users').select('id, name, leads_today').in('id', TARGET_IDS);

    for (const u of users) {
        // Set Daily Limit exactly to Leads Today (so Remaining = 0)
        const newLimit = u.leads_today;

        await supabase.from('users').update({
            daily_limit: newLimit
        }).eq('id', u.id);

        console.log(`✅ Locked ${u.name}: Limit set to ${newLimit} (Same as Leads Today). No space for Webhook.`);
    }
}

lockLimits();
