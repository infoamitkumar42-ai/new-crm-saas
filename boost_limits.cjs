const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://vewqzsqddgmkslnuctvb.supabase.co';
const ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ1MzA0NjIsImV4cCI6MjA4MDEwNjQ2Mn0.g-e8YNzEy0Z5ul1RGAhBMDj41TtWGuNPEzZz4XEGPg4";
const supabase = createClient(SUPABASE_URL, ANON_KEY);

const TARGET_IDS = [
    'd0a31bea-8a57-4584-a119-5b8e11140dbb', // Gurnam
    '2c905da5-b711-4a9c-9045-488719248bb1'  // Sandeep
];

async function boostLimits() {
    console.log("🚀 BOOSTING LIMITS FOR GURNAM & SANDEEP...\n");

    const { error } = await supabase
        .from('users')
        .update({
            daily_limit: 50,
            plan_name: 'turbo_boost', // Ensure plan allows it
            payment_status: 'active',
            is_active: true
        })
        .in('id', TARGET_IDS);

    if (error) {
        console.error("❌ Failed to boost limits:", error.message);
    } else {
        console.log("✅ Limits Boosted to 50. You can now assign leads.");
    }
}

boostLimits();
