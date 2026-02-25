const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://vewqzsqddgmkslnuctvb.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDUzMDQ2MiwiZXhwIjoyMDgwMTA2NDYyfQ.pAgMGN6MtKm1A3fsKr1GIt8-qmKYhwFjSt92L_6_7us';
const supabase = createClient(supabaseUrl, supabaseKey);

const TARGET_EMAILS = [
    'ravenjeetkaur@gmail.com', 'vansh.rajni.96@gmail.com', 'payalpuri3299@gmail.com',
    'princyrani303@gmail.com', 'aansh8588@gmail.com', 'nitinanku628@gmail.com',
    'saijelgoel4@gmail.com', 'navpreetkaur95271@gmail.com', 'officialrajinderdhillon@gmail.com',
    'prince@gmail.com', 'jaspreetkaursarao45@gmail.com', 'rupanasameer551@gmail.com',
    'ludhranimohit91@gmail.com', 'goldymahi27@gmail.com', 'amritpalkaursohi358@gmail.com',
    'surjitsingh1067@gmail.com', 'mandeepbrar1325@gmail.com', 'jk419473@gmail.com',
    'punjabivinita@gmail.com', 'ajayk783382@gmail.com', 'samandeepkaur1216@gmail.com',
    'rohitgagneja69@gmail.com', 'ziana4383@gmail.com', 'loveleenkaur8285@gmail.com'
];

const HIMANSHU_KEYWORDS = ['TFE 6444', 'Himanshu Sharma', 'Work With Himanshu', 'Digital Skills India'];

(async () => {
    console.log('--- 🚀 FINAL ASSIGNMENT & RECONCILIATION ---');

    // 1. Fetch EVERYTHING from Himanshu since Feb 18
    const { data: leads, error } = await supabase
        .from('leads')
        .select('name, phone, source, status, created_at, assigned_to')
        .gte('created_at', '2026-02-18T00:00:00Z');

    if (error) {
        console.error('Error fetching leads:', error);
        return;
    }

    const hLeads = leads.filter(l => l.source && HIMANSHU_KEYWORDS.some(k => l.source.includes(k)));

    // Status breakdown
    const statusMap = hLeads.reduce((acc, l) => {
        acc[l.status] = (acc[l.status] || 0) + 1;
        return acc;
    }, {});

    console.log(`Summary of Himanshu's ${hLeads.length} leads:`);
    console.table(statusMap);

    // 2. Identify remaining Himanshu leads in Night_Backlog
    const toAssign = hLeads.filter(l => l.status === 'Night_Backlog');
    console.log(`\nFound ${toAssign.length} Himanshu leads still in Night_Backlog.`);

    if (toAssign.length > 0) {
        // Fetch boosters
        const { data: users } = await supabase.from('users').select('id, name, email').in('email', TARGET_EMAILS).eq('is_active', true);

        console.log(`Distributing to ${users.length} active boosters...`);
        let idx = 0;
        for (const l of toAssign) {
            const user = users[idx % users.length];
            console.log(`Assigning ${l.name} -> ${user.name}`);

            await supabase.from('leads').update({
                assigned_to: user.id,
                status: 'Assigned',
                assigned_at: new Date().toISOString()
            }).eq('id', l.id);

            idx++;
        }
    }

    // 3. Check for NEW leads (last 10 minutes)
    const tenMinsAgo = new Date(Date.now() - 10 * 60 * 1000);
    const newest = hLeads.filter(l => new Date(l.created_at) > tenMinsAgo);
    console.log(`\nNew Leads in last 10 minutes: ${newest.length}`);
    newest.forEach(l => {
        console.log(`- ${l.name} | Status: ${l.status} | Source: ${l.source}`);
    });

})();
