const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://vewqzsqddgmkslnuctvb.supabase.co';
const ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ1MzA0NjIsImV4cCI6MjA4MDEwNjQ2Mn0.g-e8YNzEy0Z5ul1RGAhBMDj41TtWGuNPEzZz4XEGPg4";

const supabase = createClient(SUPABASE_URL, ANON_KEY);

async function checkUser() {
    const email = 'mamtaoad23@gmail.com';

    console.log(`🔍 CHECKING USER: ${email}\n`);

    const { data: user, error } = await supabase
        .from('users')
        .select('*')
        .ilike('email', email)
        .single();

    if (error || !user) {
        console.log("❌ User not found!");
        return;
    }

    console.log(`Name: ${user.name}`);
    console.log(`Email: ${user.email}`);
    console.log(`\n📊 PLAN STATUS:`);
    console.log(`  Plan Name: ${user.plan_name || 'NONE'}`);
    console.log(`  Payment Status: ${user.payment_status}`);
    console.log(`  Valid Until: ${user.valid_until || 'N/A'}`);
    console.log(`  Is Active: ${user.is_active}`);
    console.log(`  Is Online: ${user.is_online}`);
    console.log(`  Daily Limit: ${user.daily_limit}`);
    console.log(`  Leads Today: ${user.leads_today}`);
    console.log(`  Total Leads Received: ${user.total_leads_received}`);
    console.log(`  Total Leads Promised: ${user.total_leads_promised || 'N/A'}`);

    // Check expiry
    if (user.valid_until) {
        const expiry = new Date(user.valid_until);
        const now = new Date();
        const daysLeft = Math.ceil((expiry - now) / (1000 * 60 * 60 * 24));

        console.log(`\n⏰ EXPIRY CHECK:`);
        if (daysLeft < 0) {
            console.log(`  ❌ EXPIRED ${Math.abs(daysLeft)} days ago!`);
        } else if (daysLeft === 0) {
            console.log(`  ⚠️ Expires TODAY!`);
        } else {
            console.log(`  ✅ ${daysLeft} days remaining`);
        }
    }

    // Check if quota exhausted
    if (user.total_leads_promised && user.total_leads_received >= user.total_leads_promised) {
        console.log(`\n📦 QUOTA CHECK:`);
        console.log(`  ❌ Total Quota EXHAUSTED! (${user.total_leads_received}/${user.total_leads_promised})`);
    }

    // Reasons for stop
    console.log(`\n🔴 POSSIBLE REASONS FOR STOP:`);
    if (user.payment_status !== 'active') console.log(`  1. Payment Status is '${user.payment_status}' (not active)`);
    if (user.plan_name === 'none' || !user.plan_name) console.log(`  2. Plan is 'none' or empty`);
    if (user.is_active === false) console.log(`  3. User has PAUSED their account (is_active = false)`);
    if (user.is_online === false) console.log(`  4. User is OFFLINE (is_online = false)`);
    if (user.valid_until) {
        const expiry = new Date(user.valid_until);
        if (expiry < new Date()) console.log(`  5. Plan EXPIRED on ${expiry.toLocaleDateString()}`);
    }
    if (user.daily_limit === 0) console.log(`  6. Daily limit is 0`);
}

checkUser();
