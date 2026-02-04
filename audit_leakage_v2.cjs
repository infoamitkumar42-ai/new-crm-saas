const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://vewqzsqddgmkslnuctvb.supabase.co';
const ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ1MzA0NjIsImV4cCI6MjA4MDEwNjQ2Mn0.g-e8YNzEy0Z5ul1RGAhBMDj41TtWGuNPEzZz4XEGPg4";
const supabase = createClient(SUPABASE_URL, ANON_KEY);

async function auditLeakage() {
    console.log("🕵️‍♂️ FULL SYSTEM AUDIT: CHECKING FOR LEAKAGE...\n");

    const todayStart = new Date().toISOString().split('T')[0] + 'T00:00:00.000Z';

    // 1. Get ALL leads assigned TODAY (Manual Import specifically)
    const { data: leads, error } = await supabase
        .from('leads')
        .select('assigned_to, source')
        .gte('created_at', todayStart)
        .eq('source', 'Manual Import');

    if (error) {
        console.error("Error fetching leads:", error.message);
        return;
    }

    if (!leads || leads.length === 0) {
        console.log("✅ No Manual Import leads found today.");
        return;
    }

    // Get Unique User IDs
    const userIds = [...new Set(leads.map(l => l.assigned_to).filter(id => id))];

    // Fetch User Details
    const { data: users } = await supabase
        .from('users')
        .select('id, email, name')
        .in('id', userIds);

    const userMap = {};
    users.forEach(u => userMap[u.id] = u);

    // Count per User
    const counts = {};
    leads.forEach(l => {
        if (!l.assigned_to) return;
        const email = userMap[l.assigned_to]?.email || 'Unknown ID: ' + l.assigned_to;
        counts[email] = (counts[email] || 0) + 1;
    });

    console.log("📊 MANUAL IMPORT DISTRIBUTION (Today):");
    console.log("| User Email                     | Count | Status |");
    console.log("|--------------------------------|-------|--------|");

    const ALLOWED = [
        'sunnymehre451@gmail.com',
        'workwithrajwinder@gmail.com',
        'gurnambal01@gmail.com'
    ];

    let leakFound = false;

    for (const [email, count] of Object.entries(counts)) {
        const isAllowed = ALLOWED.includes(email);

        // Exception: Rajinder was fixed (count should be 0 or close if we fixed it, but let's see what DB says now)
        // If we see counts here, it means they are STILL assigned in DB.

        const status = isAllowed ? '✅ OK' : '❌ LEAK';

        console.log(`| ${email.padEnd(30)} | ${String(count).padEnd(5)} | ${status} |`);

        if (!isAllowed) leakFound = true;
    }

    if (!leakFound) {
        console.log("\n✅ NO UNKNOWN USERS HAVE MANUAL LEADS.");
    } else {
        console.log("\n⚠️ WARNING: Some users still hold manual leads!");
    }
}

auditLeakage();
