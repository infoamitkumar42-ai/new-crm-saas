const { createClient } = require('@supabase/supabase-js');

// HARDCODED CREDENTIALS
const SUPABASE_URL = 'https://vewqzsqddgmkslnuctvb.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDUzMDQ2MiwiZXhwIjoyMDgwMTA2NDYyfQ.pAgMGN6MtKm1A3fsKr1GIt8-qmKYhwFjSt92L_6_7us';
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const TARGET_EMAILS = [
    'sunnymehre451@gmail.com', // Sandeep
    'gurnambal01@gmail.com'    // Gurnam
];

// Jan 26, 10:30 AM IST -> UTC
// 10:30 - 5:30 = 05:00 UTC
const START_TIME_ISO = '2026-01-26T05:00:00.000Z';

async function generateReport() {
    console.log('📊 GENERATING STAFF LEAD REPORT (Since Jan 26, 10:30 AM IST)...\n');

    // 1. Get User IDs
    const { data: users } = await supabase.from('users').select('id, name, email').in('email', TARGET_EMAILS);

    const userMap = {};
    users.forEach(u => userMap[u.id] = u);
    const userIds = users.map(u => u.id);

    // 2. Fetch Leads (Raw)
    const { data: leads, error } = await supabase
        .from('leads')
        .select('id, user_id, created_at')
        .in('user_id', userIds)
        .gte('created_at', START_TIME_ISO);

    if (error) {
        console.error('Error fetching leads:', error);
        return;
    }

    // 3. Process Data
    const stats = {};
    TARGET_EMAILS.forEach(email => {
        const u = users.find(x => x.email === email);
        if (u) {
            stats[u.id] = {
                name: u.name,
                total: 0,
                yesterday: 0, // Jan 28
                today: 0,      // Jan 29
                before_yesterday: 0, // Jan 27 (10:30 AM - Midnight)
            };
        }
    });

    leads.forEach(lead => {
        const d = new Date(lead.created_at);
        // Convert to IST Day
        const istDate = d.toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata' });
        // Format: DD/MM/YYYY usually. Let's explicitly check parts to be robust.

        // Manual IST Calculation
        // Add 5.5 hours
        const istTime = new Date(d.getTime() + (5.5 * 60 * 60 * 1000));
        const day = istTime.getUTCDate();
        const month = istTime.getUTCMonth() + 1; // 1-12

        if (month === 1) {
            if (day === 27) stats[lead.user_id].before_yesterday++;
            else if (day === 28) stats[lead.user_id].yesterday++;
            else if (day === 29) stats[lead.user_id].today++;
        }

        stats[lead.user_id].total++;
    });

    // 4. Output
    console.log('-------------------------------------------------------------');
    console.log('| Name             | Total (Start-Now) | Yesterday (28th) | Today (29th) |');
    console.log('-------------------------------------------------------------');

    for (const uid of Object.keys(stats)) {
        const s = stats[uid];
        console.log(`| ${s.name.padEnd(16)} | ${String(s.total).padEnd(17)} | ${String(s.yesterday).padEnd(16)} | ${String(s.today).padEnd(11)} |`);

        // Specific user request: "TOTAL"
        // Also show broken down clearly
    }
    console.log('-------------------------------------------------------------');
    console.log('* Start Time: 27th Jan 2026, 10:30 AM IST\n');
}

generateReport();
