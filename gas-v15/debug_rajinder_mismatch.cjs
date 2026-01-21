
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://vewqzsqddgmkslnuctvb.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDUzMDQ2MiwiZXhwIjoyMDgwMTA2NDYyfQ.pAgMGN6MtKm1A3fsKr1GIt8-qmKYhwFjSt92L_6_7us';
const supabase = createClient(supabaseUrl, supabaseKey);

async function debugRajinder() {
    console.log("🕵️‍♀️ Debugging Rajinder's Lead Count...\n");

    const resetTime = '2026-01-17T18:30:00.000Z'; // Midnight IST

    // 1. Get Rajinder's DB Row
    const { data: users, error } = await supabase
        .from('users')
        .select('*')
        .ilike('name', '%Rajinder%');

    if (error || !users.length) { console.error("User not found", error); return; }

    const rajinder = users[0];
    console.log(`👤 User: ${rajinder.name} (ID: ${rajinder.id})`);
    console.log(`   daily_limit: ${rajinder.daily_limit}`);
    console.log(`   leads_today (DB Column): ${rajinder.leads_today}`);

    // 2. Count Actual Leads Assigned Today
    const { count: actualCount, error: cErr } = await supabase
        .from('leads')
        .select('*', { count: 'exact', head: true })
        .eq('assigned_to', rajinder.id)
        .gte('assigned_at', resetTime);

    console.log(`   Actual Leads Assigned: ${actualCount}`);

    const mismatch = actualCount - rajinder.leads_today;
    console.log(`   ⚠️ Mismatch: ${mismatch}`);

    if (mismatch !== 0) {
        console.log("\n❌ CRITICAL ERROR: Database counter is OUT OF SYNC.");
        console.log("   This explains why the Hard Stop failed (DB thinks he has space).");
    } else {
        console.log("\n✅ Counters match. User report might be about 'Pending' leads?");
    }
}

debugRajinder();
