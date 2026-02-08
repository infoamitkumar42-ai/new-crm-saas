const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://vewqzsqddgmkslnuctvb.supabase.co';
const ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ1MzA0NjIsImV4cCI6MjA4MDEwNjQ2Mn0.g-e8YNzEy0Z5ul1RGAhBMDj41TtWGuNPEzZz4XEGPg4";

const supabase = createClient(SUPABASE_URL, ANON_KEY);

async function getUserDetails(email) {
    console.log(`🔍 Fetching data for: ${email}\n`);

    const { data: users, error } = await supabase
        .from('users')
        .select('*')
        .eq('email', email);

    if (error) {
        console.log('❌ Error:', error.message);
        return;
    }

    if (!users || users.length === 0) {
        console.log('❌ No user found with this email');
        return;
    }

    const user = users[0];

    if (users.length > 1) {
        console.log(`⚠️ Warning: ${users.length} users found, showing first\n`);
    }

    console.log('📊 USER DETAILS\n' + '='.repeat(60));
    console.log(`Name: ${user.name}`);
    console.log(`Email: ${user.email}`);
    console.log(`Team Code: ${user.team_code}`);
    console.log(`Role: ${user.role}`);
    console.log(`Plan: ${user.plan_name}`);
    console.log('\n📈 QUOTA & LIMITS');
    console.log(`Daily Limit: ${user.daily_limit}`);
    console.log(`Leads Today: ${user.leads_today || 0}`);
    console.log(`Total Received: ${user.total_leads_received || 0}`);
    console.log(`Total Promised: ${user.total_leads_promised || 0}`);
    console.log(`Remaining: ${(user.total_leads_promised || 0) - (user.total_leads_received || 0)}`);

    console.log('\n🎯 STATUS');
    console.log(`Active: ${user.is_active ? '✅' : '❌'}`);
    console.log(`Online: ${user.is_online ? '✅' : '❌'}`);
    console.log(`Paused: ${user.is_paused ? '⏸️' : '▶️'}`);

    console.log('\n📋 FORM PREFERENCE');
    console.log(`Forms: ${user.preferred_form_ids || 'All'}`);
    console.log(`Accept All: ${user.accept_all_forms !== false ? 'Yes' : 'No'}`);

    console.log('\n📅 PLAN DATES');
    console.log(`Start: ${user.plan_start_date || 'Not set'}`);
    console.log(`Expiry: ${user.plan_expiry_date || 'Not set'}`);

    if (user.plan_expiry_date) {
        const expiry = new Date(user.plan_expiry_date);
        const now = new Date();
        const daysLeft = Math.ceil((expiry - now) / (1000 * 60 * 60 * 24));
        console.log(`Days Left: ${daysLeft > 0 ? daysLeft : '⚠️ EXPIRED'}`);
    }

    console.log('\n' + '='.repeat(60));
}

const email = process.argv[2];
if (!email) {
    console.log('Usage: node get_user_data.cjs email@example.com');
    process.exit(1);
}

getUserDetails(email);
