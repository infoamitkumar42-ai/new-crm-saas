
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://vewqzsqddgmkslnuctvb.supabase.co';
const SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDUzMDQ2MiwiZXhwIjoyMDgwMTA2NDYyfQ.pAgMGN6MtKm1A3fsKr1GIt8-qmKYhwFjSt92L_6_7us";

const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

async function inspectLead() {
    console.log("🕵️‍♂️ Inspecting Stuck Lead Structure...");

    const { data: lead } = await supabase
        .from('leads')
        .select('*')
        .eq('status', 'New')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

    if (!lead) {
        console.log("No stuck lead found now.");
        return;
    }

    console.log("\n📊 Stuck Lead Data:");
    console.log("ID:", lead.id);
    console.log("Source:", lead.source);
    console.log("Created At:", lead.created_at);
    console.log("Metadata:", lead.metadata); // Check if metadata reveals origin
    console.log("Raw Data:", JSON.stringify(lead, null, 2));

    // Guess Origin
    if (lead.source.includes('Meta -')) {
        console.log("👉 Origin: Our Webhook Script (index.ts)");
    } else {
        console.log("👉 Origin: UNKNOWN / EXTERNAL (Not our script)");
    }
}

inspectLead();
