const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://vewqzsqddgmkslnuctvb.supabase.co';
const ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ1MzA0NjIsImV4cCI6MjA4MDEwNjQ2Mn0.g-e8YNzEy0Z5ul1RGAhBMDj41TtWGuNPEzZz4XEGPg4";

const supabase = createClient(SUPABASE_URL, ANON_KEY);

async function extendMamtaPlan() {
    const email = 'mamtaoad23@gmail.com';

    console.log(`🔧 EXTENDING PLAN FOR: ${email}\n`);

    // Extend by 10 days from now
    const newExpiry = new Date();
    newExpiry.setDate(newExpiry.getDate() + 10);

    const { data, error } = await supabase
        .from('users')
        .update({
            valid_until: newExpiry.toISOString(),
            daily_limit: 5, // Starter plan limit
            payment_status: 'active'
        })
        .ilike('email', email)
        .select();

    if (error) {
        console.log(`❌ Error: ${error.message}`);
        return;
    }

    console.log(`✅ PLAN EXTENDED!`);
    console.log(`New Expiry: ${newExpiry.toLocaleDateString()}`);
    console.log(`Daily Limit: 5`);
}

extendMamtaPlan();
