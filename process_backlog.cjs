const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = "https://vewqzsqddgmkslnuctvb.supabase.co";
const SUPABASE_SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDUzMDQ2MiwiZXhwIjoyMDgwMTA2NDYyfQ.pAgMGN6MtKm1A3fsKr1GIt8-qmKYhwFjSt92L_6_7us";

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function distributeBacklog() {
  console.log("🚀 Starting Night Backlog Distribution...");

  const today = new Date();
  today.setHours(0,0,0,0);

  // 1. Fetch Stuck Leads
  const { data: stuckLeads, error } = await supabase
    .from('leads')
    .select('id, name, created_at, source, status')
    .is('assigned_to', null)
    .gte('created_at', today.toISOString());

  if (error || !stuckLeads) {
     console.error("❌ Fetch Error:", error);
     return;
  }

  console.log(`📊 Found ${stuckLeads.length} leads to process.`);

  for (const lead of stuckLeads) {
     console.log(`🔄 Processing: ${lead.name} [${lead.source}]...`);
     
     // 2. Call Atomic Assignment (CORRECTED ARGS)
     const { data, error: rpcError } = await supabase.rpc('assign_lead_atomically', {
       p_lead_id: lead.id,
       p_source: lead.source
     });

     if (rpcError) {
        // If "Function signature mismatch" happens, try without p_source
        // But previously it worked with p_source.
        // If this fails, I might need to check definition.
        console.error(`   ❌ Failed: ${rpcError.message}`);
     } else {
        console.log(`   ✅ Success! Assigned to: ${data}`);
     }
  }

  console.log("🏁 Distribution Complete.");
}

distributeBacklog();
