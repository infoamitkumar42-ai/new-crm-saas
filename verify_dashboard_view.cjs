
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://vewqzsqddgmkslnuctvb.supabase.co';
const SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDUzMDQ2MiwiZXhwIjoyMDgwMTA2NDYyfQ.pAgMGN6MtKm1A3fsKr1GIt8-qmKYhwFjSt92L_6_7us";

const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

const TARGET_EMAIL = 'jk419473@gmail.com';

async function verifyLiveView() {
    console.log(`🕵️‍♂️ VERIFYING DASHBOARD DATA VIEW for ${TARGET_EMAIL}...\n`);

    // 1. Get User
    const { data: user } = await supabase.from('users').select('id, name').eq('email', TARGET_EMAIL).single();
    if (!user) return console.log("❌ User not found.");

    console.log(`👤 User: ${user.name}`);

    // 2. Simulate User Dashboard Query
    // "Show me leads assigned to me, ordered by assigned_at desc"

    const today = new Date().toISOString().split('T')[0];

    const { data: leads } = await supabase.from('leads')
        .select('id, name, created_at, assigned_at, status')
        .eq('assigned_to', user.id)
        .order('assigned_at', { ascending: false }) // Dashboard sorts by latest assigned
        .limit(10); // Show top 10

    console.log("\n📲 SIMULATED DASHBOARD LIST (Top 10):");
    console.table(leads);

    // 3. Check specific leads from 'Today'
    const visibleToday = leads.filter(l => l.assigned_at && l.assigned_at.startsWith(today));

    if (visibleToday.length > 0) {
        console.log(`\n✅ SUCCESS: ${visibleToday.length} leads are visible for TODAY (${today})`);
        console.log("   (These will appear at the TOP of their screen)");
    } else {
        console.log(`\n❌ FAILURE: No leads found with today's date in 'assigned_at'. User sees OLD data.`);
    }
}

verifyLiveView();
