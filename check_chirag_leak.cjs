const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://vewqzsqddgmkslnuctvb.supabase.co';
const ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ1MzA0NjIsImV4cCI6MjA4MDEwNjQ2Mn0.g-e8YNzEy0Z5ul1RGAhBMDj41TtWGuNPEzZz4XEGPg4";
const supabase = createClient(SUPABASE_URL, ANON_KEY);

async function checkChiragTeamLeak() {
    console.log("🕵️‍♂️ INVESTIGATING CHIRAG'S TEAM LEAKAGE...\n");

    const todayStart = new Date().toISOString().split('T')[0] + 'T00:00:00.000Z';

    // 1. Check Ashwin specifically
    const { data: ashwin } = await supabase.from('users').select('id, email, leads_today').eq('email', 'jogadiyaashwin61@gmail.com').single();
    if (ashwin) {
        // Check actual leads
        const { count } = await supabase.from('leads').select('*', { count: 'exact', head: true }).eq('user_id', ashwin.id);
        console.log(`👤 अश्विन (Ashwin): ${ashwin.email}`);
        console.log(`   - Leads Today Counter: ${ashwin.leads_today}`);
        console.log(`   - Actual Assigned Leads: ${count}`);

        if (count > 0) {
            // Show details
            const { data: leads } = await supabase.from('leads').select('name, phone, source, created_at').eq('user_id', ashwin.id);
            leads.forEach(l => console.log(`     > ${l.name} (${l.source})`));
        }
    } else {
        console.log("❌ Ashwin not found in users.");
    }

    console.log("\n📋 LIST OF EVERYONE WHO GOT LEADS TODAY:");
    console.log("(Please identify Chirag's team members from this list)");

    // Get ALL assignments today (Any source)
    const { data: assignments, error } = await supabase
        .from('leads')
        .select('assigned_to, users!inner(email, name)')
        .gte('created_at', todayStart);

    if (error) console.log(error.message);

    const counts = {};
    assignments.forEach(a => {
        const key = `${a.users.name} (${a.users.email})`;
        counts[key] = (counts[key] || 0) + 1;
    });

    console.log(`| User                             | Count |`);
    console.log(`|----------------------------------|-------|`);
    for (const [user, count] of Object.entries(counts)) {
        console.log(`| ${user.padEnd(32)} | ${count}     |`);
    }
}

checkChiragTeamLeak();
