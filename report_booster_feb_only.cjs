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

const CSV_FILE = 'BOOSTER_FEB_ONLY_AUDIT.csv';

(async () => {
    console.log(`=== 🕵️ FEBRUARY-ONLY AUDIT: 24 BOOSTER USERS ===`);

    const headers = ['Name,Email,Renewal_Date_Feb,Feb_Promised,Feb_Received,Feb_Pending,Jan_Leads_Context'];
    const rows = [];
    let totalFebPending = 0;

    for (const email of EMAILS) {
        // 1. Fetch User
        const { data: user, error: userError } = await supabase
            .from('users')
            .select('id, name, email')
            .eq('email', email)
            .single();

        if (userError || !user) { console.error(`User not found: ${email}`); continue; }

        // 2. Fetch Feb Payments
        const { data: febPayments } = await supabase
            .from('payments')
            .select('*')
            .eq('user_id', user.id)
            .eq('status', 'captured')
            .gte('created_at', '2026-02-01T00:00:00')
            .lte('created_at', '2026-02-28T23:59:59')
            .order('created_at', { ascending: true });

        // 3. Calc Feb Promised & First Renewal Date
        let febPromised = 0;
        let renewalDate = 'N/A';
        if (febPayments && febPayments.length > 0) {
            renewalDate = new Date(febPayments[0].created_at).toLocaleDateString('en-IN');
            febPayments.forEach(p => {
                if (p.amount >= 1900) febPromised += 108; // All Boosters (Weekly/Turbo) = 108 as per user
                else if (p.amount >= 900) febPromised += 50; // Starter
            });
        }

        // 4. Jan Leads Context
        const { count: janLeads } = await supabase
            .from('leads')
            .select('*', { count: 'exact', head: true })
            .eq('assigned_to', user.id)
            .gte('created_at', '2026-01-01T00:00:00')
            .lte('created_at', '2026-01-31T23:59:59');

        // 5. Feb Received (Since first Feb Renewal)
        let febReceived = 0;
        if (febPayments && febPayments.length > 0) {
            const firstPayIso = new Date(febPayments[0].created_at).toISOString();
            const { count: sinceCount } = await supabase
                .from('leads')
                .select('*', { count: 'exact', head: true })
                .eq('assigned_to', user.id)
                .gte('created_at', firstPayIso);
            febReceived = sinceCount || 0;
        } else {
            // Check leads since Feb 1st if no pay in Feb? User said "when they renew in Feb"
            const { count: febTotalCount } = await supabase
                .from('leads')
                .select('*', { count: 'exact', head: true })
                .eq('assigned_to', user.id)
                .gte('created_at', '2026-02-01T00:00:00');
            febReceived = febTotalCount || 0;
        }

        const febPending = Math.max(0, febPromised - febReceived);
        totalFebPending += febPending;

        rows.push(`"${user.name}","${user.email}",${renewalDate},${febPromised},${febReceived},${febPending},${janLeads || 0}`);
    }

    fs.writeFileSync(CSV_FILE, headers.concat(rows).join('\n'));
    console.log(`✅ Feb-Only Report saved to ${CSV_FILE}`);
    console.log(`\nTOTAL PENDING LEADS (Feb Only) for 24 users: ${totalFebPending}`);

    // Console output for user
    console.log('\n| Name | Renewal Date | Feb Promised | Feb Received | Feb Pending | Jan Leads |');
    console.log('|---|---|---|---|---|---|');
    rows.forEach(r => {
        const parts = r.split(',');
        console.log(`| ${parts[0].replace(/\"/g, '')} | ${parts[2]} | ${parts[3]} | ${parts[4]} | **${parts[5]}** | ${parts[6]} |`);
    });

})();
