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

(async () => {
    // 1. Calculate 10 PM IST "Yesterday" (Since it's 12 AM now)
    const now = new Date();
    const cutoff = new Date(now);

    // Adjust for UTC/IST logic safely. 
    // If it's 00:50 AM IST (19th), 10 PM IST (18th) was ~3 hours ago.
    // IST is UTC+5:30. 10 PM IST = 16:30 UTC.

    // Simplest approach: Look back 4 hours from now to cover the 10 PM slot.
    cutoff.setHours(cutoff.getHours() - 4);

    console.log(`=== 🌙 NIGHT SHIFT AUDIT (Since ${cutoff.toLocaleTimeString()}) ===`);

    const { data, error } = await supabase
        .from('leads')
        .select('name, source, status, created_at, users!leads_assigned_to_fkey(name, email, team_code)')
        .gte('created_at', cutoff.toISOString())
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching leads:', error);
        return;
    }

    console.log(`Total Leads Found: ${data.length}`);

    const assignedLeads = data.filter(l => l.status === 'Assigned');

    if (assignedLeads.length === 0) {
        console.log('No assigned leads found in this period.');
    } else {
        console.log('| Time (IST) | Lead Name | Assigned To | Team | Target Booster? | Source |');
        console.log('|---|---|---|---|---|---|');

        assignedLeads.forEach(l => {
            const email = l.users?.email;
            const isTarget = email ? TARGET_EMAILS.includes(email) : false;
            const team = l.users?.team_code || 'N/A';
            const assigned = l.users?.name || 'Unassigned';

            // Convert to IST
            const date = new Date(l.created_at);
            const istTime = date.toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata', hour12: true });

            console.log(`| ${istTime} | ${l.name} | ${assigned} | ${team} | ${isTarget ? '✅ YES' : '❌ NO'} | ${l.source.substring(0, 20)}... |`);
        });

        const targetCount = assignedLeads.filter(l => l.users && TARGET_EMAILS.includes(l.users.email)).length;
        console.log(`\nAccuracy: ${targetCount}/${assignedLeads.length} leads went to Target Boosters (${((targetCount / assignedLeads.length) * 100).toFixed(1)}%)`);
    }

})();
