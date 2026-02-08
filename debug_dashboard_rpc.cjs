
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://vewqzsqddgmkslnuctvb.supabase.co';
const SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDUzMDQ2MiwiZXhwIjoyMDgwMTA2NDYyfQ.pAgMGN6MtKm1A3fsKr1GIt8-qmKYhwFjSt92L_6_7us";

const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

async function debug() {
    console.log("🕵️ DEBUGGING DASHBOARD RPC...");

    // 1. Check Leads directly
    const { count: realLeads, data: sample } = await supabase
        .from('leads')
        .select('created_at', { count: 'exact' })
        .gte('created_at', new Date(new Date().setHours(0, 0, 0, 0)).toISOString());

    console.log(`📊 REAL LEADS TODAY (JS Query): ${realLeads}`);
    if (sample && sample.length > 0) {
        console.log(`   Sample Lead Time: ${sample[0].created_at}`);
    }

    // 2. Call RPC
    const { data: rpcData, error: rpcError } = await supabase.rpc('get_admin_dashboard_data');

    if (rpcError) {
        console.error("❌ RPC FAILED:", rpcError);
    } else {
        const stats = rpcData.leads_stats;
        console.log("📉 RPC REPORT SAYS:");
        console.log(`   leads_today:      ${stats.leads_today}`);
        console.log(`   leads_this_week:  ${stats.leads_this_week}`);
        console.log(`   total_leads:      ${stats.total_leads}`);

        if (stats.leads_today === 0 && realLeads > 0) {
            console.error("🚨 DISCREPANCY DETECTED: RPC is blind to today's leads!");
        } else {
            console.log("✅ RPC matches JS Query.");
        }
    }
}

debug();
