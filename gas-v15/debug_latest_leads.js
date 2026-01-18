import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://vewqzsqddgmkslnuctvb.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDUzMDQ2MiwiZXhwIjoyMDgwMTA2NDYyfQ.pAgMGN6MtKm1A3fsKr1GIt8-qmKYhwFjSt92L_6_7us';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function debugLatest() {
    console.log('\n🐞 --- DEBUG LATEST LEADS ---\n');

    // Just get last 50 leads created
    const { data: leads, error } = await supabase
        .from('leads')
        .select('created_at, name, assigned_to, users(name)')
        .order('created_at', { ascending: false })
        .limit(100);

    if (error) {
        console.error("Error:", error);
        return;
    }

    console.log(`Fetched ${leads.length} leads.`);
    if (leads.length > 0) {
        console.log(`Latest: ${leads[0].created_at}`);
        console.log(`Oldest (in sample): ${leads[leads.length - 1].created_at}`);
    }

    // Distribution in this sample
    const userCounts = {};
    const hourMap = {};

    leads.forEach(l => {
        const uName = l.users ? l.users.name : 'Unassigned/Null';
        userCounts[uName] = (userCounts[uName] || 0) + 1;

        const d = new Date(l.created_at);
        const dIST = new Date(d.getTime() + (5.5 * 60 * 60 * 1000));
        const hourKey = `${dIST.getUTCDate()}/${dIST.getUTCMonth() + 1} ${dIST.getUTCHours()}:00`;
        hourMap[hourKey] = (hourMap[hourKey] || 0) + 1;
    });

    console.log("\n📅 RECENT HOURLY VOLUME (IST approx):");
    Object.keys(hourMap).sort().forEach(k => {
        console.log(`${k}: ${hourMap[k]}`);
    });

    console.log("\n👥 DISTRIBUTION IN LAST 100 LEADS:");
    Object.entries(userCounts).sort((a, b) => b[1] - a[1]).forEach(([u, c]) => {
        console.log(`${u}: ${c}`);
    });
}

debugLatest();
