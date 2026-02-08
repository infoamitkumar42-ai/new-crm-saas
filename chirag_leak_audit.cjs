
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://vewqzsqddgmkslnuctvb.supabase.co';
const SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDUzMDQ2MiwiZXhwIjoyMDgwMTA2NDYyfQ.pAgMGN6MtKm1A3fsKr1GIt8-qmKYhwFjSt92L_6_7us";

const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

async function chiragAudit() {
    console.log("🕵️‍♂️ CHIRAG LEAD LEAKAGE AUDIT (Today)...\n");

    const today = new Date().toISOString().split('T')[0];

    // 1. Fetch EVERYTHING related to Chirag or Bhumit
    const { data: leads } = await supabase.from('leads')
        .select('id, status, source, created_at')
        .or('source.ilike.%chirag%,source.ilike.%bhumit%')
        .gte('created_at', today);

    if (!leads) {
        console.log("No leads found for these sources.");
        return;
    }

    const totalInCRM = leads.length;
    const breakdown = {};
    leads.forEach(l => {
        breakdown[l.status] = (breakdown[l.status] || 0) + 1;
    });

    console.log(`📊 TOTAL LEADS FOUND IN CRM (Chirag Sources): ${totalInCRM}`);
    console.log("-----------------------------------------");
    console.log("Status Breakdown:");
    Object.entries(breakdown).forEach(([status, count]) => {
        console.log(`- ${status.padEnd(20)}: ${count}`);
    });

    console.log("\n-----------------------------------------");
    const gap = 83 - totalInCRM;
    if (gap > 0) {
        console.log(`🚨 MISSING FROM CRM COMPLETELY: ${gap} Leads.`);
        console.log("   (These 19 leads probably never reached the Webhook or were dropped).");
    } else if (breakdown['Duplicate']) {
        console.log(`💡 NOTE: ${breakdown['Duplicate']} Leads are in CRM but marked as Duplicate.`);
    }
}

chiragAudit();
