
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://vewqzsqddgmkslnuctvb.supabase.co';
const SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDUzMDQ2MiwiZXhwIjoyMDgwMTA2NDYyfQ.pAgMGN6MtKm1A3fsKr1GIt8-qmKYhwFjSt92L_6_7us";

const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

async function checkOthers() {
    console.log("🕵️‍♂️ Auditing Himanshu & Rajwinder Teams...");

    const startOfDay = new Date(); startOfDay.setHours(0, 0, 0, 0);

    // Fetch all leads NOT from Chirag
    const { data: leads } = await supabase.from('leads')
        .select('source, status')
        .gte('created_at', startOfDay.toISOString())
        .not('source', 'ilike', '%chirag%')
        .not('source', 'ilike', '%manual%'); // Exclude Chirag Manual too

    // Filter by Team Interests
    const himanshuLeads = leads.filter(l => l.source.match(/fire|cbo|himanshu|work with/i));
    const rajwinderLeads = leads.filter(l => l.source.match(/rajwinder|raj|punjabi/i)); // Adjust based on known source names

    console.log(`\n🔥 HIMANSHU TEAM (Total Today): ${himanshuLeads.length}`);
    const hStuck = himanshuLeads.filter(l => l.status === 'New' || l.status === 'Orphan').length;
    console.log(`   - Assigned: ${himanshuLeads.length - hStuck}`);
    console.log(`   - STUCK: ${hStuck}`);

    console.log(`\n🦁 RAJWINDER TEAM (Total Today): ${rajwinderLeads.length}`);
    const rStuck = rajwinderLeads.filter(l => l.status === 'New' || l.status === 'Orphan').length;
    console.log(`   - Assigned: ${rajwinderLeads.length - rStuck}`);
    console.log(`   - STUCK: ${rStuck}`);

    // Sources Breakdown
    console.log("\n📊 Source Breakdown (Himanshu/Rajwinder):");
    const sources = {};
    [...himanshuLeads, ...rajwinderLeads].forEach(l => sources[l.source] = (sources[l.source] || 0) + 1);
    console.table(sources);
}

checkOthers();
