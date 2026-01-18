import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://vewqzsqddgmkslnuctvb.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDUzMDQ2MiwiZXhwIjoyMDgwMTA2NDYyfQ.pAgMGN6MtKm1A3fsKr1GIt8-qmKYhwFjSt92L_6_7us';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function verifyGap() {
    console.log('\n📊 --- FINAL DISTRIBUTION & GAP CHECK ---\n');

    // 1. Fetch Users Map
    const { data: users } = await supabase.from('users').select('id, name');
    const userMap = {};
    if (users) {
        users.forEach(u => userMap[u.id] = u.name);
    }

    // 2. Fetch Latest 200 Leads
    const { data: leads, error } = await supabase
        .from('leads')
        .select('created_at, assigned_to, name, phone')
        .order('created_at', { ascending: false })
        .limit(200);

    if (error) {
        console.error("Error fetching leads:", error.message);
        return;
    }

    // 3. Analyze Time Coverage
    const hourMap = {};
    const missingGapStart = new Date('2026-01-16T16:00:00+05:30').getTime(); // Jan 16 4 PM
    const missingGapEnd = new Date('2026-01-17T04:00:00+05:30').getTime();   // Jan 17 4 AM

    let gapLeadsCount = 0;

    leads.forEach(l => {
        const d = new Date(l.created_at);
        const ts = d.getTime();

        // Count bucket (IST)
        const dIST = new Date(ts + (5.5 * 60 * 60 * 1000));
        const key = `${dIST.getUTCDate()}/${dIST.getUTCMonth() + 1} ${dIST.getUTCHours()}:00`;
        hourMap[key] = (hourMap[key] || 0) + 1;

        if (ts >= missingGapStart && ts <= missingGapEnd) {
            gapLeadsCount++;
        }
    });

    console.log("📅 HOURLY VOLUME (IST):");
    const sortedHours = Object.keys(hourMap).sort((a, b) => {
        // loose sort by string is okay for simple dd/mm check or parse
        return a.localeCompare(b);
    });

    sortedHours.forEach(k => {
        console.log(`${k.padEnd(15)} : ${hourMap[k]}`);
    });

    console.log(`\n🔎 GAP CHECK (Jan 16 4 PM - Jan 17 4 AM): Found ${gapLeadsCount} leads.`);

    // 4. Distribution Report (Assignee Count in Batch)
    const assigneeCounts = {};
    leads.forEach(l => {
        const uid = l.assigned_to;
        const uName = userMap[uid] || 'Unassigned';
        assigneeCounts[uName] = (assigneeCounts[uName] || 0) + 1;
    });

    console.log("\n👥 LATEST 200 LEADS DISTRIBUTION:");
    Object.entries(assigneeCounts)
        .sort((a, b) => b[1] - a[1]) // highest first
        .forEach(([name, count]) => {
            console.log(`${name.padEnd(20)} : ${count}`);
        });

}

verifyGap();
