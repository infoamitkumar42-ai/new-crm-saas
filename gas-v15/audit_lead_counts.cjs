
const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://vewqzsqddgmkslnuctvb.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDUzMDQ2MiwiZXhwIjoyMDgwMTA2NDYyfQ.pAgMGN6MtKm1A3fsKr1GIt8-qmKYhwFjSt92L_6_7us';
const supabase = createClient(supabaseUrl, supabaseKey);

async function auditCounters() {
    console.log("🔍 Auditing Lead Counters vs Actuals (Since Today 00:00 IST)...\n");

    // 1. Calculate Reset Time (Yesterday 18:30 UTC)
    // Current IST is 18th Jan ~4 PM. Reset was 17th Jan 18:30 UTC.
    // Dynamic Logic:
    const now = new Date();
    // In UTC, if time is < 18:30, reset was yesterday 18:30.
    // If time is > 18:30, reset was today 18:30.
    // Actually, simple way: Midnight IST is UTC+5:30.
    // So Reset is at 18:30 UTC.

    // Hardcoding for today's context (18th Jan) to be precise
    // Since it's 16:00 IST (10:30 UTC), previous reset was 17th Jan 18:30 UTC.
    const resetTime = '2026-01-17T18:30:00.000Z';

    console.log(`📅 Reset Time Used: ${resetTime}`);

    // 2. Fetch Users
    const { data: users, error } = await supabase
        .from('users')
        .select('id, name, leads_today, daily_limit')
        .eq('is_active', true);

    if (error) { console.error(error); return; }

    console.log(`👥 Checking ${users.length} Active Users...`);
    console.log("---------------------------------------------------");
    console.log(`| Name | Counter | Actual | Status |`);
    console.log("---------------------------------------------------");

    let mismatchCount = 0;

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

        let status = "✅ OK";
        if (actual !== recorded) {
            status = "❌ MISMATCH";
            mismatchCount++;
        }

        if (status === "❌ MISMATCH") {
            console.log(`| ${u.name.padEnd(20)} | ${String(recorded).padEnd(7)} | ${String(actual).padEnd(6)} | ${status} |`);
        }
    }

    console.log("---------------------------------------------------");
    console.log(`📉 Total Mismatches Found: ${mismatchCount}`);
}

auditCounters();
