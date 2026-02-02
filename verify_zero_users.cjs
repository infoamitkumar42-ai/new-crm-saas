const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://vewqzsqddgmkslnuctvb.supabase.co';
const ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ1MzA0NjIsImV4cCI6MjA4MDEwNjQ2Mn0.g-e8YNzEy0Z5ul1RGAhBMDj41TtWGuNPEzZz4XEGPg4";
const supabase = createClient(SUPABASE_URL, ANON_KEY);

async function verifyZeroLeadUsers() {
    console.log("🔍 VERIFYING PAYMENT STATUS OF ZERO LEAD USERS...\n");

    const { data: users, error } = await supabase
        .from('users')
        .select('id, name, email, plan_name, payment_status, is_active, is_online, leads_today')
        .eq('is_online', true)
        .eq('leads_today', 0); // Only checking those with 0 leads

    if (error) {
        console.log(`❌ Error: ${error.message}`);
        return;
    }

    console.log(`Found ${users.length} Online Users with 0 Leads.\n`);

    users.forEach(u => {
        let statusIcon = '✅'; // Assume paid
        let warning = '';

        if (u.payment_status !== 'active') {
            statusIcon = '🔴';
            warning = '⚠️ NOT ACTIVE PAYMENT';
        } else if (u.plan_name === 'none') {
            statusIcon = '🔴';
            warning = '⚠️ NO PLAN';
        } else if (u.is_active === false) {
            statusIcon = '🟠';
            warning = '⚠️ PAUSED (Inactive)';
        }

        console.log(`${statusIcon} ${u.name.padEnd(20)} | Plan: ${u.plan_name.padEnd(10)} | Status: ${u.payment_status} | ${warning}`);
    });
}

verifyZeroLeadUsers();
