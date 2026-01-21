
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://vewqzsqddgmkslnuctvb.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDUzMDQ2MiwiZXhwIjoyMDgwMTA2NDYyfQ.pAgMGN6MtKm1A3fsKr1GIt8-qmKYhwFjSt92L_6_7us';
const supabase = createClient(supabaseUrl, supabaseKey);

async function syncAllCounters() {
    console.log("🔄 Auditing & Syncing ALL User Counters...\n");

    const resetTime = '2026-01-17T18:30:00.000Z'; // 12:00 AM IST

    // 1. Get All Active Users
    const { data: users, error } = await supabase
        .from('users')
        .select('id, name, leads_today, daily_limit')
        .eq('is_active', true);

    if (error) { console.error("Err:", error); return; }

    console.log(`📋 Checking ${users.length} active users...`);
    let fixedCount = 0;

    for (const u of users) {
        // 2. Count ACTUAL leads
        const { count: actualCount, error: cErr } = await supabase
            .from('leads')
            .select('*', { count: 'exact', head: true })
            .eq('assigned_to', u.id)
            .gte('assigned_at', resetTime);

        if (cErr) continue;

        const dbCount = u.leads_today || 0;

        if (dbCount !== actualCount) {
            console.log(`   ⚠️ Desync: ${u.name.padEnd(20)} | DB: ${dbCount} vs Actual: ${actualCount} | Syncing...`);

            // 3. FIX IT
            await supabase
                .from('users')
                .update({ leads_today: actualCount })
                .eq('id', u.id);

            fixedCount++;
        }
    }

    console.log(`\n✅ Done. Synced ${fixedCount} users.`);
    if (fixedCount > 0) {
        console.log("   Hard Stop Trigger should now work correctly for these users.");
    }
}

syncAllCounters();
