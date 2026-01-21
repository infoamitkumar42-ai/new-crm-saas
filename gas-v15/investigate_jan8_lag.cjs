
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://vewqzsqddgmkslnuctvb.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDUzMDQ2MiwiZXhwIjoyMDgwMTA2NDYyfQ.pAgMGN6MtKm1A3fsKr1GIt8-qmKYhwFjSt92L_6_7us';
const supabase = createClient(supabaseUrl, supabaseKey);

async function investigateLag() {
    console.log("🕵️‍♀️ Investigating Jan 8 Lag for Navjot's Leads...\n");

    const email = 'knavjotkaur113@gmail.com';
    const resetTime = '2026-01-17T18:30:00.000Z';

    // 1. Get User Filters
    const { data: user } = await supabase.from('users').select('*').eq('email', email).single();
    if (!user) return;

    console.log(`👤 User: ${user.name}`);
    console.log(`   Filters: ${JSON.stringify(user.filters)}`);
    console.log(`   Manager ID: ${user.manager_id}`);

    // 2. Get Her Assigned Leads (Today)
    const { data: leads } = await supabase
        .from('leads')
        .select('*')
        .eq('assigned_to', user.id)
        .gte('assigned_at', resetTime)
        .limit(5); // Check first 5

    console.log(`\n🔍 First 5 Leads Assigned Today:`);

    leads.forEach(l => {
        console.log(`   Lead ID: ${l.id}`);
        console.log(`   Name: ${l.name}`);
        console.log(`   Phone: ${l.phone}`);
        console.log(`   City: ${l.city} | State: ${l.state}`);
        console.log(`   Source: ${l.source}`);
        console.log(`   -------------------------------------------------`);
    });

    console.log("\n💡 Analysis Hypothesis:");
    console.log("   If 'State' is present but 'City' is missing or vague,");
    console.log("   our NEW 'State Inference from Phone' logic likely unlocked these today.");
}

investigateLag();
