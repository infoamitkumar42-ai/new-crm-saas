const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://vewqzsqddgmkslnuctvb.supabase.co';
const ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ1MzA0NjIsImV4cCI6MjA4MDEwNjQ2Mn0.g-e8YNzEy0Z5ul1RGAhBMDj41TtWGuNPEzZz4XEGPg4";
const supabase = createClient(SUPABASE_URL, ANON_KEY);

async function auditLeakage() {
    console.log("🕵️‍♂️ FULL SYSTEM AUDIT: CHECKING FOR LEAKAGE...\n");

    const todayStart = new Date().toISOString().split('T')[0] + 'T00:00:00.000Z';

    // 1. Get ALL leads assigned TODAY (Manual Import specifically is the concern)
    const { data: leads, error } = await supabase
        .from('leads')
        .select('assigned_to, source, created_at, users!inner(email, name, plan_name)')
        .gte('created_at', todayStart)
        .eq('source', 'Manual Import');

    if (error) {
        console.error("Error fetching leads:", error.message);
        return;
    }

    const counts = {};
    const details = {}; // Map email -> count

    leads.forEach(l => {
        const email = l.users?.email || 'Unknown';
        counts[email] = (counts[email] || 0) + 1;
        details[email] = l.users;
    });

    console.log("📊 MANUAL IMPORT DISTRIBUTION (Today):");
    console.log("| User Email | Count | Status |");
    console.log("|---|---|---|");

    const ALLOWED = [
        'sunnymehre451@gmail.com',
        'workwithrajwinder@gmail.com',
        'gurnambal01@gmail.com'
    ];

    let leakFound = false;

    for (const [email, count] of Object.entries(counts)) {
        const isAllowed = ALLOWED.includes(email);
        const status = isAllowed ? '✅ OK' : '❌ LEAK';

        console.log(`| ${email.padEnd(30)} | ${String(count).padEnd(5)} | ${status} |`);

        if (!isAllowed) leakFound = true;
    }

    if (!leakFound) {
        console.log("\n✅ NO UNKNOWN USERS HAVE MANUAL LEADS.");
    } else {
        console.log("\n⚠️ WARNING: Some users have leads they shouldn't!");
    }

    // 2. CHECK NEW USERS (Joined Today) for ANY leads
    console.log("\n🔍 CHECKING NEW USERS (Joined Today) FOR UNEXPECTED LEADS...");
    const { data: newUsers } = await supabase.from('users').select('id, email, name, created_at').gte('created_at', todayStart);

    if (newUsers && newUsers.length > 0) {
        for (const u of newUsers) {
            const { count } = await supabase.from('leads').select('*', { count: 'exact', head: true }).eq('user_id', u.id);
            if (count > 0) {
                console.log(`⚠️ New User ${u.email} has ${count} leads! (Check if intentional)`);
            }
        }
    } else {
        console.log("No new users joined today to check.");
    }
}

auditLeakage();
