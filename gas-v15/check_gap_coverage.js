import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://vewqzsqddgmkslnuctvb.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDUzMDQ2MiwiZXhwIjoyMDgwMTA2NDYyfQ.pAgMGN6MtKm1A3fsKr1GIt8-qmKYhwFjSt92L_6_7us';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function analyzeCoverageAndDistribution() {
    console.log('\n📊 --- GAP ANALYSIS & DISTRIBUTION REPORT ---\n');

    // 1. GAP ANALYSIS (Jan 16 12:00 PM to Jan 17 23:59 PM)
    const startCheck = new Date('2026-01-16T12:00:00+05:30').toISOString();

    // Fetch all leads in this range
    const { data: leads } = await supabase
        .from('leads')
        .select('created_at, assigned_to, users(name)')
        .gte('created_at', startCheck)
        .order('created_at', { ascending: true });

    if (!leads) {
        console.log("No leads found in check period.");
        return;
    }

    // Bucket by Hour
    const timeMap = {};
    leads.forEach(l => {
        const d = new Date(l.created_at);
        // Convert to IST roughly for display (UTC+5.5)
        const dIST = new Date(d.getTime() + (5.5 * 60 * 60 * 1000));
        const key = `${dIST.getUTCMonth() + 1}/${dIST.getUTCDate()} ${dIST.getUTCHours()}:00`;
        timeMap[key] = (timeMap[key] || 0) + 1;
    });

    console.log("📅 HOURLY LEAD VOLUME (Jan 16 PM - Jan 17):");
    console.log("---------------------------------------------");
    Object.keys(timeMap).forEach(k => {
        const bar = '█'.repeat(timeMap[k]);
        console.log(`${k.padEnd(15)} | ${timeMap[k]} ${bar}`);
    });
    console.log("---------------------------------------------\n");


    // 2. DISTRIBUTION REPORT (Who got what TODAY?)
    // Filter for assigned_at > today start or leads created today
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const recentlyAssigned = leads.filter(l => l.assigned_to && new Date(l.created_at) > todayStart);

    const userCounts = {};
    recentlyAssigned.forEach(l => {
        const uName = l.users ? l.users.name : 'Unknown User';
        userCounts[uName] = (userCounts[uName] || 0) + 1;
    });

    console.log("👥 USER DISTRIBUTION (Recent Imports):");
    console.log("---------------------------------------------");
    const sortedUsers = Object.entries(userCounts).sort((a, b) => b[1] - a[1]);

    sortedUsers.forEach(([name, count]) => {
        console.log(`${name.padEnd(25)} : ${count}`);
    });

    console.log("\nSummary:");
    console.log(`Total Covered in Window: ${leads.length}`);
    console.log(`Leads assigned recently: ${recentlyAssigned.length}`);
}

analyzeCoverageAndDistribution();
