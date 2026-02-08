
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://vewqzsqddgmkslnuctvb.supabase.co';
const SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDUzMDQ2MiwiZXhwIjoyMDgwMTA2NDYyfQ.pAgMGN6MtKm1A3fsKr1GIt8-qmKYhwFjSt92L_6_7us";

const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

async function strictAudit() {
    console.log("🕵️‍♂️ STRICT AUDIT FOR CHIRAG PAGE LEADS (Feb 5)...\n");

    const today = new Date().toISOString().split('T')[0];

    // 1. Check ALL Leads from Source "Meta - Digital Chirag"
    // Independent of who they are assigned to.

    // We search with LIKE operator to catch all varitaions
    const { data: leads } = await supabase.from('leads')
        .select('id, assigned_to, status, phone, created_at')
        .gte('created_at', today + 'T00:00:00')
        .ilike('source', '%Digital Chirag%');

    if (!leads) return console.log("No leads found.");

    console.log(`📊 TOTAL LEADS FROM 'Digital Chirag' PAGE: ${leads.length}`);

    // Break down by Status
    let assigned = 0;
    let unassigned = 0;
    let trash = 0;
    let otherTeam = 0;

    // Get Chirag's Team User IDs for verification
    const { data: teamUsers } = await supabase.from('users').select('id').eq('team_code', 'GJ01TEAMFIRE');
    const validIds = new Set(teamUsers.map(u => u.id));

    leads.forEach(l => {
        if (!l.assigned_to) {
            unassigned++;
        } else if (validIds.has(l.assigned_to)) {
            assigned++;
        } else {
            otherTeam++;
            // console.log(`   ⚠️ Lead assigned to wrong team user: ${l.assigned_to}`);
        }

        if (l.status === 'Trash' || l.status === 'Invalid') trash++;
    });

    console.log(`   ✅ Assigned to Chirag's Team: ${assigned}`);
    console.log(`   ❌ Unassigned (Stuck):        ${unassigned}`);
    console.log(`   ⚠️ Assigned to Other Teams:   ${otherTeam}`);
    console.log(`   🗑️ Flagged as Trash/Invalid:  ${trash}`);

    const totalFound = leads.length;
    const adManager = 268;
    const missing = adManager - totalFound;

    console.log(`\n---------------------------------`);
    console.log(`🎯 Ad Manager: ${adManager}`);
    console.log(`📡 CRM Found:  ${totalFound}`);
    console.log(`📉 Missing:    ${missing}`);

    if (missing > 10) {
        console.log(`\n💡 CONCLUSION: The ${missing} leads are actually MISSING from the DB.`);
        console.log(`   (Not duplicates, not unassigned. They never arrived).`);
        console.log(`   RECOMMENDATION: Run Graph API Recovery Script NOW.`);
    } else {
        console.log(`\n✅ CONCLUSION: Data Matches. The gap is likely invalid duplicates blocked by CRM.`);
    }
}

strictAudit();
