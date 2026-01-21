
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://vewqzsqddgmkslnuctvb.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDUzMDQ2MiwiZXhwIjoyMDgwMTA2NDYyfQ.pAgMGN6MtKm1A3fsKr1GIt8-qmKYhwFjSt92L_6_7us';
const supabase = createClient(supabaseUrl, supabaseKey);

async function generateFullReport() {
    console.log("📊 OLD USERS - COMPLETE DISTRIBUTION REPORT\n");
    console.log("=".repeat(60));

    const todayStart = '2026-01-17T18:30:00.000Z';

    // Get all active users with limit > 0 (exclude paused)
    const { data: users, error } = await supabase
        .from('users')
        .select('id, name, leads_today, daily_limit, created_at')
        .eq('is_active', true)
        .gt('daily_limit', 0)
        .order('leads_today', { ascending: false });

    if (error) { console.error("Err:", error); return; }

    // Filter OLD users (created before today)
    const oldUsers = users.filter(u => new Date(u.created_at) < new Date(todayStart));

    // Separate FULL and PENDING
    const fullUsers = oldUsers.filter(u => u.leads_today >= u.daily_limit);
    const pendingUsers = oldUsers.filter(u => u.leads_today < u.daily_limit);

    // Calculate totals
    let totalAssigned = oldUsers.reduce((sum, u) => sum + (u.leads_today || 0), 0);

    // FULL LIST
    console.log(`\n✅ FULL USERS (Quota Complete): ${fullUsers.length}`);
    console.log("-".repeat(60));
    console.log(`| # | Name                 | Assigned | Limit |`);
    console.log("-".repeat(60));
    fullUsers.forEach((u, i) => {
        console.log(`| ${String(i + 1).padStart(2)} | ${u.name.padEnd(20)} | ${String(u.leads_today).padEnd(8)} | ${u.daily_limit} |`);
    });

    // PENDING LIST
    console.log(`\n\n🚨 PENDING USERS (Quota Remaining): ${pendingUsers.length}`);
    console.log("-".repeat(60));
    console.log(`| # | Name                 | Assigned | Limit | Needed |`);
    console.log("-".repeat(60));
    let totalPending = 0;
    pendingUsers.forEach((u, i) => {
        const needed = u.daily_limit - u.leads_today;
        totalPending += needed;
        console.log(`| ${String(i + 1).padStart(2)} | ${u.name.padEnd(20)} | ${String(u.leads_today).padEnd(8)} | ${String(u.daily_limit).padEnd(5)} | 🚨 ${needed} |`);
    });

    // SUMMARY
    console.log(`\n${"=".repeat(60)}`);
    console.log(`📈 SUMMARY (OLD USERS ONLY):`);
    console.log(`   Total Old Users:      ${oldUsers.length}`);
    console.log(`   Full (100%):          ${fullUsers.length}`);
    console.log(`   Pending:              ${pendingUsers.length}`);
    console.log(`   Total Leads Assigned: ${totalAssigned}`);
    console.log(`   Total Leads Pending:  ${totalPending}`);
    console.log(`${"=".repeat(60)}`);
}

generateFullReport();
