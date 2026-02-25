const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const supabaseUrl = 'https://vewqzsqddgmkslnuctvb.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDUzMDQ2MiwiZXhwIjoyMDgwMTA2NDYyfQ.pAgMGN6MtKm1A3fsKr1GIt8-qmKYhwFjSt92L_6_7us';
const supabase = createClient(supabaseUrl, supabaseKey);

const EMAILS = [
    'ravenjeetkaur@gmail.com', 'vansh.rajni.96@gmail.com', 'payalpuri3299@gmail.com',
    'princyrani303@gmail.com', 'aansh8588@gmail.com', 'nitinanku628@gmail.com',
    'saijelgoel4@gmail.com', 'navpreetkaur95271@gmail.com', 'officialrajinderdhillon@gmail.com',
    'prince@gmail.com', 'jaspreetkaursarao45@gmail.com', 'rupanasameer551@gmail.com',
    'ludhranimohit91@gmail.com', 'goldymahi27@gmail.com', 'amritpalkaursohi358@gmail.com',
    'surjitsingh1067@gmail.com', 'mandeepbrar1325@gmail.com', 'jk419473@gmail.com',
    'punjabivinita@gmail.com', 'ajayk783382@gmail.com', 'samandeepkaur1216@gmail.com',
    'rohitgagneja69@gmail.com', 'ziana4383@gmail.com', 'loveleenkaur8285@gmail.com'
];

const CSV_FILE = 'BOOSTER_FINAL_REFINED_AUDIT.csv';

(async () => {
    console.log(`=== 🕵️ REFINED BOOSTER AUDIT: 24 USERS ===`);
    console.log(`Logic: Quota (92/108) - Leads Since Latest Renewal\n`);

    const headers = ['Name,Email,Latest_Renewal,Plan_Type,Quota,Received_Since_Renew,Pending_Corrected'];
    const rows = [];

    for (const email of EMAILS) {
        // 1. Fetch User
        const { data: user, error: userError } = await supabase
            .from('users')
            .select('id, name, email, plan_name')
            .eq('email', email)
            .single();

        if (userError || !user) { console.error(`User not found: ${email}`); continue; }

        // 2. Fetch Latest Payment
        const { data: payments } = await supabase
            .from('payments')
            .select('*')
            .eq('user_id', user.id)
            .eq('status', 'captured')
            .order('created_at', { ascending: false })
            .limit(1);

        let latestRenewalDate = null;
        let quota = 92; // Default Weekly
        let planType = 'Weekly';

        if (payments && payments.length > 0) {
            const lastPay = payments[0];
            latestRenewalDate = new Date(lastPay.created_at);
            if (lastPay.amount >= 2400 || lastPay.plan_name.includes('turbo')) {
                quota = 108;
                planType = 'Turbo';
            }
        } else {
            // Check for Rajni case (manual activation or other)
            // Rajni had a 30 Jan payment in my previous script.
            // Let's search all payments for Jan/Feb
            const { data: allPay } = await supabase
                .from('payments')
                .select('*')
                .eq('user_id', user.id)
                .eq('status', 'captured')
                .gte('created_at', '2026-01-20')
                .order('created_at', { ascending: false });

            if (allPay && allPay.length > 0) {
                latestRenewalDate = new Date(allPay[0].created_at);
                if (allPay[0].amount >= 2400) { quota = 108; planType = 'Turbo'; }
            }
        }

        // 3. Count Leads Received Since latestRenewalDate
        let receivedSinceRenew = 0;
        if (latestRenewalDate) {
            const { count } = await supabase
                .from('leads')
                .select('*', { count: 'exact', head: true })
                .eq('assigned_to', user.id)
                .gte('created_at', latestRenewalDate.toISOString());
            receivedSinceRenew = count || 0;
        }

        const pending = Math.max(0, quota - receivedSinceRenew);
        const renewalDateStr = latestRenewalDate ? latestRenewalDate.toLocaleDateString('en-IN') : 'N/A';

        rows.push(`"${user.name}","${user.email}",${renewalDateStr},${planType},${quota},${receivedSinceRenew},${pending}`);
    }

    fs.writeFileSync(CSV_FILE, headers.concat(rows).join('\n'));
    console.log(`✅ Final Refined Report saved to ${CSV_FILE}`);

    // Console output summary
    console.log('\n| Name | Latest Renew | Plan | Quota | Received | **Pending** |');
    console.log('|---|---|---|---|---|---|');
    rows.forEach(r => {
        const f = r.split(',');
        console.log(`| ${f[0].replace(/\"/g, '')} | ${f[2]} | ${f[3]} | ${f[4]} | ${f[5]} | **${f[6]}** |`);
    });

})();
