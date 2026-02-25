const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const supabaseUrl = 'https://vewqzsqddgmkslnuctvb.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDUzMDQ2MiwiZXhwIjoyMDgwMTA2NDYyfQ.pAgMGN6MtKm1A3fsKr1GIt8-qmKYhwFjSt92L_6_7us';
const supabase = createClient(supabaseUrl, supabaseKey);

const PLAN_QUOTAS = {
    'starter': 50,
    'weekly_boost': 105,
    'turbo_boost': 98,
    'supervisor': 105,
    'manager': 160
};

// The 24 boosters list (emails provided by user earlier)
const boostersEmails = [
    'ravenjeetkaur@gmail.com', 'vansh.rajni.96@gmail.com', 'payalpuri3299@gmail.com',
    'princyrani303@gmail.com', 'aansh8588@gmail.com', 'nitinanku628@gmail.com',
    'saijelgoel4@gmail.com', 'navpreetkaur95271@gmail.com', 'officialrajinderdhillon@gmail.com',
    'prince@gmail.com', 'jaspreetkaursarao45@gmail.com', 'rupanasameer551@gmail.com',
    'ludhranimohit91@gmail.com', 'goldymahi27@gmail.com', 'amritpalkaursohi358@gmail.com',
    'surjitsingh1067@gmail.com', 'mandeepbrar1325@gmail.com', 'jk419473@gmail.com',
    'punjabivinita@gmail.com', 'ajayk783382@gmail.com', 'samandeepkaur1216@gmail.com',
    'rohitgagneja69@gmail.com', 'ziana4383@gmail.com', 'loveleenkaur8285@gmail.com'
];

(async () => {
    console.log('--- 💰💰 MASTER PAYMENT-FIRST DEEP AUDIT 💰💰 ---');
    console.log('Method: 10x Verification (Individual Payment Timestamps)\n');

    // 1. Fetch 'captured' Feb payments
    const { data: payments, error } = await supabase
        .from('payments')
        .select('*')
        .eq('status', 'captured')
        .gte('created_at', '2026-02-01T00:00:00Z')
        .order('created_at', { ascending: false });

    if (error) { console.error('Payment Fetch Error:', error); return; }

    // 2. Identify the most recent payment for each user in Feb
    const uniquePayers = new Map();
    payments.forEach(p => {
        if (!uniquePayers.has(p.payer_email)) {
            uniquePayers.set(p.payer_email, p);
        }
    });

    console.log(`Total Unique Payers in Feb: ${uniquePayers.size}`);

    const report = [];
    let totalPromised = 0;
    let totalReceived = 0;
    let totalPending = 0;

    for (const [email, pay] of uniquePayers) {
        // Find User Profile
        const { data: user } = await supabase
            .from('users')
            .select('id, name, team_code')
            .eq('email', email)
            .single();

        if (!user) {
            console.warn(`User profile not found for payer: ${email}`);
            continue;
        }

        // Quota Logic (Dada provided these in manual table)
        let quota = PLAN_QUOTAS[pay.plan_name] || 0;

        // Manual override for special quotas from Dada's table
        if (pay.amount === 999) quota = 50; // Starter
        if (pay.amount === 1999) quota = 105; // Weekly/Super
        if (pay.amount === 2499) quota = 98; // Turbo
        if (pay.amount === 2999) quota = 160; // Manager

        // EXCEPTION: Dada's manual table special values
        if (email === 'jk419473@gmail.com') quota = 98; // Jashandeep Turbo
        if (email === 'princyrani303@gmail.com') quota = 98; // Princy Turbo
        if (email === 'mandeepbrar1325@gmail.com') quota = 155; // Mandeep Weekly (2 payments?)

        // Count leads Received SINCE this payment
        const { count } = await supabase
            .from('leads')
            .select('*', { count: 'exact', head: true })
            .eq('assigned_to', user.id)
            .gte('created_at', pay.created_at);

        const receivedSincePay = count || 0;
        const pending = Math.max(0, quota - receivedSincePay);

        totalPromised += quota;
        totalReceived += receivedSincePay;
        totalPending += pending;

        report.push({
            name: user.name,
            email: email,
            team: user.team_code,
            paidAt: pay.created_at,
            plan: pay.plan_name,
            amount: pay.amount,
            quota: quota,
            receivedSincePay: receivedSincePay,
            pending: pending,
            isBooster: boostersEmails.includes(email)
        });
    }

    // --- REPORT GENERATION ---

    // 1. BOOSTER-SPECIFIC REPORT
    const boosterReport = report.filter(r => r.isBooster);
    const boosterPendingSum = boosterReport.reduce((s, r) => s + r.pending, 0);
    const boosterReceivedSum = boosterReport.reduce((s, r) => s + r.receivedSincePay, 0);
    const boosterPromisedSum = boosterReport.reduce((s, r) => s + r.quota, 0);

    console.log('\n--- 🚀 REPORT: 24 BOOSTERS (Paid-in-Feb Only) ---');
    console.table(boosterReport.map(b => ({
        Name: b.name,
        Quota: b.quota,
        "Received since Pay": b.receivedSincePay,
        Pending: b.pending
    })));
    console.log(`Boosters Total Promised: ${boosterPromisedSum}`);
    console.log(`Boosters Total Received since Pay: ${boosterReceivedSum}`);
    console.log(`Boosters Total Pending leads: ${boosterPendingSum}`);

    // 2. GRAND TOTAL SYSTEM DEMAND (Paid-in-Feb users)
    console.log('\n--- 🏁 GRAND TOTAL (All Paid Feb Users) ---');
    console.log(`Total Goal (6346 approx): ${totalPromised}`);
    console.log(`Total Leads Generated & Assigned: ${totalReceived}`);
    console.log(`Total Pending Demand (To be generated): ${totalPending}`);

    // 3. IDENTIFY RECENT ASSIGNMENTS (The 495 leads user mentioned)
    // Let's count leads assigned in the last 24h
    const { count: last24h } = await supabase
        .from('leads')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

    console.log(`\nLeads assigned in the last 24 hours: ${last24h}`);

})();
