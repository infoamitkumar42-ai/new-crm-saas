const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://vewqzsqddgmkslnuctvb.supabase.co';
const ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ1MzA0NjIsImV4cCI6MjA4MDEwNjQ2Mn0.g-e8YNzEy0Z5ul1RGAhBMDj41TtWGuNPEzZz4XEGPg4";
const supabase = createClient(SUPABASE_URL, ANON_KEY);

async function checkUnpaidAssignments() {
    console.log("🕵️ CHECKING FOR UNPAID ASSIGNMENTS (TODAY)...\n");

    // 1. Get all users who received leads today (>0)
    const { data: users, error } = await supabase
        .from('users')
        .select('id, name, email, plan_name, payment_status, leads_today')
        .gt('leads_today', 0);

    if (error) {
        console.log(`❌ Error: ${error.message}`);
        return;
    }

    let unpaidCount = 0;
    let totalAssignedUsers = users.length;

    console.log(`Checking ${totalAssignedUsers} users who got leads today...\n`);

    users.forEach(u => {
        let isFlagged = false;
        let reason = '';

        if (u.payment_status !== 'active') {
            isFlagged = true;
            reason = `Payment Status: ${u.payment_status}`;
        } else if (u.plan_name === 'none' || !u.plan_name) {
            isFlagged = true;
            reason = `Plan: ${u.plan_name}`;
        }

        if (isFlagged) {
            console.log(`🔴 FLAG: ${u.name} got ${u.leads_today} leads! [${reason}]`);
            unpaidCount++;
        }
    });

    if (unpaidCount === 0) {
        console.log("✅ ALL GOOD! No unpaid/free users received leads today.");
    } else {
        console.log(`\n⚠️  WARNING: ${unpaidCount} unpaid users received leads!`);
    }
}

checkUnpaidAssignments();
