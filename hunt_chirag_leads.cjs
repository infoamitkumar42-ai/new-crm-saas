
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://vewqzsqddgmkslnuctvb.supabase.co';
const SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDUzMDQ2MiwiZXhwIjoyMDgwMTA2NDYyfQ.pAgMGN6MtKm1A3fsKr1GIt8-qmKYhwFjSt92L_6_7us";

const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

async function findMissingChiragLeads() {
    console.log("🕵️‍♂️ Hunting for Chirag's Missing Leads...");

    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    // Get ALL leads today
    const { data: leads, error } = await supabase
        .from('leads')
        .select('*')
        .gte('created_at', startOfDay.toISOString());

    if (error) { console.error(error); return; }

    // Filter logic in JS to be flexible
    const chiragPossibleMatches = leads.filter(l => {
        const s = (l.source || '').toLowerCase();
        // Exclude known Himanshu/Rajwinder sources
        if (s.includes('rajwinder')) return false;
        if (s.includes('cbo fast')) return false;
        if (s.includes('web landing')) return false; // Usually test
        return true; // Use ye bache hue leads hain -> Inko Check karo!
    });

    console.log(`\n🔎 Found ${chiragPossibleMatches.length} 'Unusual' Leads (Not Rajwinder/Himanshu CBO):`);

    if (chiragPossibleMatches.length > 0) {
        console.table(chiragPossibleMatches.map(l => ({
            id: l.id,
            name: l.name,
            source: l.source,
            created_at: new Date(l.created_at).toLocaleTimeString()
        })));
    } else {
        console.log("❌ No leads found outside of Rajwinder/Himanshu CBO sources.");
    }
}

findMissingChiragLeads();
