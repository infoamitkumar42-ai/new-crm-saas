const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://vewqzsqddgmkslnuctvb.supabase.co';
const ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ1MzA0NjIsImV4cCI6MjA4MDEwNjQ2Mn0.g-e8YNzEy0Z5ul1RGAhBMDj41TtWGuNPEzZz4XEGPg4";
const supabase = createClient(SUPABASE_URL, ANON_KEY);

const TARGET_IDS = [
    'd0a31bea-8a57-4584-a119-5b8e11140dbb', // Gurnam
    '2c905da5-b711-4a9c-9045-488719248bb1'  // Sandeep
];

async function boostLimitsFinal() {
    console.log("🚀 BOOSTING LIMITS WITH VALIDITY...");

    const futureDate = new Date();
    futureDate.setFullYear(2030);

    const { error } = await supabase
        .from('users')
        .update({
            daily_limit: 100,
            plan_name: 'turbo_boost',
            payment_status: 'active',
            is_active: true,
            valid_until: futureDate.toISOString()
        })
        .in('id', TARGET_IDS);

    if (error) console.error("Update Error:", error);

    // Verify
    const { data: users } = await supabase.from('users').select('name, daily_limit, valid_until').in('id', TARGET_IDS);
    console.log("Verification:", users);
}

boostLimitsFinal();
