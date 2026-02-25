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

const CSV_FILE = 'BOOSTER_COMPREHENSIVE_AUDIT.csv';

(async () => {
    console.log(`=== 🕵️ COMPREHENSIVE AUDIT: 24 BOOSTER USERS ===`);

    const headers = ['Name,Email,Plan,Feb_Payments,Total_Promised_Calc,Total_Received_Ever,Leads_Since_Feb_Renew,Pending_Final'];
    const rows = [];

    for (const email of EMAILS) {
        // 1. Fetch User
        const { data: user, error: userError } = await supabase
            .from('users')
            .select('id, name, email, plan_name, total_leads_promised, total_leads_received')
            .eq('email', email)
            .single();

        if (userError || !user) {
            console.error(`User not found: ${email}`);
            continue;
        }

        // 2. Fetch Payments
        const { data: payments } = await supabase
            .from('payments')
            .select('*')
            .eq('user_id', user.id)
            .eq('status', 'captured')
            .order('created_at', { ascending: true });

        // 3. Calculate Promised
        let totalPromised = 0;
        let lastRenewDate = null;
        let febPayCount = 0;

        payments.forEach(p => {
            const date = new Date(p.created_at);
            const isFeb = date.getMonth() === 1 && date.getFullYear() === 2026;

            let leadsPerPlan = 0;
            if (p.amount >= 2400) leadsPerPlan = 108; // Turbo
            else if (p.amount >= 1900) leadsPerPlan = 84; // Weekly (based on system)
            else if (p.amount >= 900) leadsPerPlan = 50; // Starter

            // Overrides based on common custom settings if any? No, sticking to rules.
            totalPromised += leadsPerPlan;

            if (isFeb) {
                febPayCount++;
                lastRenewDate = date;
            }
        });

        // 4. Fetch Leads
        const { count: totalReceived } = await supabase
            .from('leads')
            .select('*', { count: 'exact', head: true })
            .eq('assigned_to', user.id);

        let leadsSinceRenew = 0;
        if (lastRenewDate) {
            const { count: sinceCount } = await supabase
                .from('leads')
                .select('*', { count: 'exact', head: true })
                .eq('assigned_to', user.id)
                .gte('created_at', lastRenewDate.toISOString());
            leadsSinceRenew = sinceCount;
        }

        const pending = Math.max(0, totalPromised - totalReceived);

        rows.push(`"${user.name}","${user.email}",${user.plan_name},${febPayCount},${totalPromised},${totalReceived},${leadsSinceRenew},${pending}`);
    }

    fs.writeFileSync(CSV_FILE, headers.concat(rows).join('\n'));
    console.log(`✅ Audit Report saved to ${CSV_FILE}`);

    // Print summary to console
    console.log('\n| Name | Feb Pays | Promised | Received | Since Renew | Pending |');
    console.log('|---|---|---|---|---|---|');
    rows.forEach(r => {
        const parts = r.split(',');
        console.log(`| ${parts[0].replace(/\"/g, '')} | ${parts[3]} | ${parts[4]} | ${parts[5]} | ${parts[6]} | **${parts[7]}** |`);
    });

})();
