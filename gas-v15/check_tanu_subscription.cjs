
const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://vewqzsqddgmkslnuctvb.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDUzMDQ2MiwiZXhwIjoyMDgwMTA2NDYyfQ.pAgMGN6MtKm1A3fsKr1GIt8-qmKYhwFjSt92L_6_7us';
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkTanuSubscription() {
    console.log("🔍 Checking Tanu's Push Subscription (For Notification)...\n");

    // 1. Get Tanu ID
    const { data: users, error } = await supabase
        .from('users')
        .select('id, name')
        .eq('email', 'dhawantanu536@gmail.com')
        .single();

    if (error) { console.error("User Error:", error); return; }
    console.log(`👤 User: ${users.name} (${users.id})`);

    // 2. Check Subscriptions
    const { data: subs, error: sErr } = await supabase
        .from('push_subscriptions')
        .select('*')
        .eq('user_id', users.id);

    if (sErr) { console.error("Sub Error:", sErr); return; }

    if (subs.length > 0) {
        console.log(`✅ Found ${subs.length} Device(s) Registered.`);
        console.log("   Ready to trigger notifications.");
    } else {
        console.log("❌ No Push Subscription Found. Notification will FAIL.");
    }
}

checkTanuSubscription();
