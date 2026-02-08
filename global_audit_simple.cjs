
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://vewqzsqddgmkslnuctvb.supabase.co';
const SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDUzMDQ2MiwiZXhwIjoyMDgwMTA2NDYyfQ.pAgMGN6MtKm1A3fsKr1GIt8-qmKYhwFjSt92L_6_7us";

const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

async function globalAuditSimple() {
    console.log("🌍 GLOBAL AUDIT (Simple): All Leads Today...\n");

    const today = new Date().toISOString().split('T')[0];

    const { data: leads, error } = await supabase.from('leads')
        .select('id, source, status, assigned_to, created_at')
        .gte('created_at', today + 'T00:00:00');

    if (error) return console.error(error);

    console.log(`📊 TOTAL LEADS IN SYSTEM TODAY: ${leads.length}`);

    const sourceBreakdown = {};
    leads.forEach(l => {
        sourceBreakdown[l.source || 'UNKNOWN'] = (sourceBreakdown[l.source || 'UNKNOWN'] || 0) + 1;
    });

    console.log("\nSource-wise Breakdown:");
    Object.entries(sourceBreakdown).forEach(([s, c]) => console.log(`- ${s.padEnd(25)}: ${c} Leads`));
}

globalAuditSimple();
