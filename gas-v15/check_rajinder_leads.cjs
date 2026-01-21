
const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://vewqzsqddgmkslnuctvb.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDUzMDQ2MiwiZXhwIjoyMDgwMTA2NDYyfQ.pAgMGN6MtKm1A3fsKr1GIt8-qmKYhwFjSt92L_6_7us';
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkRajinder() {
    console.log("🔍 Checking Leads for: officialrajinderdhillon@gmail.com...\n");

    // 1. Get User
    const { data: users, error } = await supabase
        .from('users')
        .select('*')
        .eq('email', 'officialrajinderdhillon@gmail.com');

    if (error || !users.length) { console.error("❌ User not found or Error:", error); return; }
    const u = users[0];

    console.log(`👤 User: ${u.name}`);
    console.log(`   ID: ${u.id}`);
    console.log(`   Leads Today (Counter): ${u.leads_today}`);
    console.log(`   Daily Limit: ${u.daily_limit}`);
    console.log("------------------------------------------");

    // 2. Count Actual Leads Since Midnight IST
    // Midnight IST = Previous Day 18:30 UTC
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);
    // Adjust for IST (generic "start of day" check)
    // Actually, let's just look at last 24h to be safe or use the explicit logic
    // Just finding all "Assigned" leads with assigned_at > today midnight IST

    // Hacky approx: check all leads from last 24 hours
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0); // Local time execution environment

    const { data: leads, error: lError } = await supabase
        .from('leads')
        .select('id, name, phone, assigned_at, status')
        .eq('assigned_to', u.id)
        .gte('assigned_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()) // Last 24h buffer
        .order('assigned_at', { ascending: false });

    if (lError) { console.error(lError); return; }

    console.log(`📋 Actual Leads Assigned (Last 24h Check):`);
    let todayCount = 0;

    leads.forEach(l => {
        // Convert to IST string for visual check
        const date = new Date(l.assigned_at);
        const options = { timeZone: 'Asia/Kolkata', hour12: true };
        const istDate = date.toLocaleString('en-IN', options);

        // Simple "Today" check based on typical workflow
        // If assigned_at is today's date in IST

        console.log(`- [${istDate}] ${l.name} (${l.status})`);
        todayCount++;
    });

    console.log(`\n✅ Total Found in Query: ${todayCount}`);
}

checkRajinder();
