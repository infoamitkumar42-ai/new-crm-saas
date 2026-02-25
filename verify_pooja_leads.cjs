const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = "https://vewqzsqddgmkslnuctvb.supabase.co";
const SUPABASE_SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDUzMDQ2MiwiZXhwIjoyMDgwMTA2NDYyfQ.pAgMGN6MtKm1A3fsKr1GIt8-qmKYhwFjSt92L_6_7us";

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function verifyPooja() {
    console.log("🔍 VERIFYING LEAD HISTORY FOR POOJA...");
    const email = 'jollypooja5@gmail.com';

    // 1. Get User ID
    const { data: user } = await supabase.from('users').select('id, name, created_at').eq('email', email).single();
    if (!user) { console.log("User not found"); return; }

    console.log(`👤 User: ${user.name} (Joined: ${new Date(user.created_at).toLocaleDateString()})`);

    // 2. Count Leads
    const { count, error } = await supabase
        .from('leads')
        .select('*', { count: 'exact', head: true })
        .eq('assigned_to', user.id);

    console.log(`📊 TOTAL LEADS IN DATABASE: ${count}`);

    // 3. Get Last 5 Leads for Proof
    const { data: leads } = await supabase
        .from('leads')
        .select('name, phone, created_at, lead_source')
        .eq('assigned_to', user.id)
        .order('created_at', { ascending: false })
        .limit(5);

    console.log("\n🕒 LAST 5 LEADS:");
    leads.forEach(l => {
        console.log(`- ${l.name} (${new Date(l.created_at).toLocaleDateString()}) - Source: ${l.lead_source}`);
    });
}

verifyPooja();
