const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://vewqzsqddgmkslnuctvb.supabase.co';
const ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ1MzA0NjIsImV4cCI6MjA4MDEwNjQ2Mn0.g-e8YNzEy0Z5ul1RGAhBMDj41TtWGuNPEzZz4XEGPg4";

const supabase = createClient(SUPABASE_URL, ANON_KEY);

async function checkQuotaExpiry() {
    console.log("🔍 CHECKING PLAN EXPIRY & QUOTA STATUS (ANON KEY)...\n");

    const { data: users, error } = await supabase
        .from('users')
        .select('id, name, email, plan_name, is_active, payment_status, total_leads_received, total_leads_promised')
        .neq('plan_name', 'none');

    if (error) return console.log("Supabase Error: " + error.message);

    let overActive = [];
    let expiredStopped = [];
    let activeRunning = [];
    let pausedRunning = [];

    users.forEach(u => {
        const received = u.total_leads_received || 0;
        const promised = u.total_leads_promised || 0;

        const isQuotaFinished = (promised > 0 && received >= promised);

        if (isQuotaFinished) {
            if (u.is_active) {
                overActive.push(u);
            } else {
                expiredStopped.push(u);
            }
        } else {
            if (u.is_active) {
                activeRunning.push(u);
            } else {
                pausedRunning.push(u);
            }
        }
    });

    console.log(`📊 TOTAL ACTIVE PLAN HOLDERS: ${users.length}`);
    console.log(`--------------------------------------------------`);
    console.log(`✅ Active Running (Live):            ${activeRunning.length}`);
    console.log(`⏸️  Paused Users (Quota Left):        ${pausedRunning.length}`);
    console.log(`--------------------------------------------------`);
    console.log(`🛑 Expired & Stopped (Completed):     ${expiredStopped.length}`);
    console.log(`⚠️  Expired but Active (Bug?):        ${overActive.length}`);
    console.log(`--------------------------------------------------\n`);

    if (pausedRunning.length > 0) {
        console.log(`📋 PAUSED USERS (Quota Left):`);
        pausedRunning.forEach(u => {
            console.log(`  🟠 ${u.name.padEnd(20)} | ${u.plan_name.padEnd(10)} | Leads: ${u.total_leads_received}/${u.total_leads_promised}`);
        });
    }

    if (expiredStopped.length > 0) {
        console.log(`\n🛑 COMPLETED USERS (Quota Full):`);
        expiredStopped.forEach(u => {
            console.log(`  ✅ ${u.name.padEnd(20)} | Leads: ${u.total_leads_received}/${u.total_leads_promised}`);
        });
    } else {
        console.log("\nℹ️  NOTE: No users have fully exhausted their quota yet.");
    }
}

checkQuotaExpiry();
