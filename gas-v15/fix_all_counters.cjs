
const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://vewqzsqddgmkslnuctvb.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDUzMDQ2MiwiZXhwIjoyMDgwMTA2NDYyfQ.pAgMGN6MtKm1A3fsKr1GIt8-qmKYhwFjSt92L_6_7us';
const supabase = createClient(supabaseUrl, supabaseKey);

async function fixAllCounters() {
    console.log("🛠 FIXING Lead Counters for All Users (Syncing with Actuals)...\n");

    const resetTime = '2026-01-17T18:30:00.000Z'; // Today's Reset (Yesterday 18:30 UTC)

    // 1. Fetch Users
    const { data: users, error } = await supabase
        .from('users')
        .select('id, name, leads_today')
        .eq('is_active', true);

    if (error) { console.error(error); return; }

    let fixedCount = 0;

    for (const u of users) {
        // Count Actuals
        const { count, error: cError } = await supabase
            .from('leads')
            .select('*', { count: 'exact', head: true })
            .eq('assigned_to', u.id)
            .gte('assigned_at', resetTime);

        if (cError) { console.error(`Error checking ${u.name}:`, cError); continue; }

        const actual = count || 0;
        const recorded = u.leads_today || 0;

        if (actual !== recorded) {
            console.log(`🔧 Fixing ${u.name}: ${recorded} -> ${actual}`);

            const { error: uError } = await supabase
                .from('users')
                .update({ leads_today: actual })
                .eq('id', u.id);

            if (uError) console.error(`   ❌ Failed:`, uError);
            else fixedCount++;
        }
    }

    console.log("---------------------------------------------------");
    console.log(`✅ Total Users Optimized: ${fixedCount}`);
}

fixAllCounters();
