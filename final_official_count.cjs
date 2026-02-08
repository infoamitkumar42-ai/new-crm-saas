
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://vewqzsqddgmkslnuctvb.supabase.co';
const SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDUzMDQ2MiwiZXhwIjoyMDgwMTA2NDYyfQ.pAgMGN6MtKm1A3fsKr1GIt8-qmKYhwFjSt92L_6_7us";

const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

async function finalAudit() {
    console.log("📊 OFFICIAL CRM LEAD COUNT (For Ad Manager Comparison) - FEB 5\n");

    const today = new Date().toISOString().split('T')[0];

    const { data: leads } = await supabase.from('leads')
        .select('source, status')
        .gte('created_at', today + 'T00:00:00');

    if (!leads) return console.log("No leads today.");

    // --- CHIRAG PAGE (FB ONLY) ---
    const chiragFB = leads.filter(l =>
        (l.source || '').includes('Meta - Digital Chirag') ||
        (l.source || '').includes('Chirag Missing Recovery')
    ).length;

    // --- HIMANSHU PAGE (FB ONLY) ---
    const himanshuFB = leads.filter(l =>
        (l.source || '').includes('New CBO FAST LEADS') ||
        (l.source || '').toLowerCase().includes('himanshu')
    ).length;

    // --- RAJWINDER PAGE (FB ONLY) ---
    const rajwinderFB = leads.filter(l =>
        (l.source || '').includes('rajwinder ad new')
    ).length;

    // --- MANUAL / OTHER ---
    const manualLeads = leads.filter(l =>
        (l.source || '').toLowerCase().includes('manual')
    ).length;

    console.log("🚀 FACEBOOK ADS NUMBERS (Pure FB Sources):");
    console.log(`1. CHIRAG PAGE:    ${chiragFB} Leads`);
    console.log(`2. HIMANSHU PAGE:  ${himanshuFB} Leads`);
    console.log(`3. RAJWINDER PAGE: ${rajwinderFB} Leads`);

    console.log("\n📝 MANUAL ENTRIES (Not from FB Ads Today):");
    console.log(`- Manual Chirag/Himanshu: ${manualLeads} Leads`);

    console.log("\n🌍 TOTAL IN CRM TODAY: ${leads.length} Leads");
    console.log("\n-----------------------------------------");
    console.log("Sir, aap Ad Manager mein 'Digital Chirag' aur 'Himanshu' ki 1-Day (Today) report dekhiye.");
}

finalAudit();
