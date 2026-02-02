const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://vewqzsqddgmkslnuctvb.supabase.co';
const ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ1MzA0NjIsImV4cCI6MjA4MDEwNjQ2Mn0.g-e8YNzEy0Z5ul1RGAhBMDj41TtWGuNPEzZz4XEGPg4";
const supabase = createClient(SUPABASE_URL, ANON_KEY);

async function checkQuota() {
    console.log("🕵️ CHECKING RAVEENA QUOTA (SMART CHECK)...\n");

    const userId = "efb60694-6dd8-4ae2-b08c-87f04a5eb9ea"; // Raveena
    const planName = "supervisor"; // 115 leads per payment

    // 1. Get Payments
    const { data: payments } = await supabase.from('payments').select('id, amount').eq('user_id', userId).eq('status', 'captured');
    const paymentCount = payments ? payments.length : 0;
    const planLimit = 115; // Supervisor
    const totalQuota = planLimit * (paymentCount || 1); // Default 1 if no payment recorded acting as manual

    console.log(`Payments Found: ${paymentCount}`);
    console.log(`Plan Limit (Supervisor): ${planLimit}`);
    console.log(`TOTAL QUOTA ALLOWED: ${totalQuota}`);

    // 2. Get Total Leads
    const { count: totalLeads } = await supabase
        .from('leads')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId);

    console.log(`TOTAL LEADS RECEIVED: ${totalLeads}`);

    if (totalLeads >= totalQuota) {
        console.log(`❌ QUOTA EXHAUSTED! (${totalLeads} >= ${totalQuota})`);
        console.log("Reason: System is skipping her because Total Quota is full.");
    } else {
        console.log(`✅ QUOTA AVAILABLE (${totalQuota - totalLeads} remaining)`);
    }
}

checkQuota();
