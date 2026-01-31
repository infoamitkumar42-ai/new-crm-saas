const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://vewqzsqddgmkslnuctvb.supabase.co';
const ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ1MzA0NjIsImV4cCI6MjA4MDEwNjQ2Mn0.g-e8YNzEy0Z5ul1RGAhBMDj41TtWGuNPEzZz4XEGPg4";
const supabase = createClient(SUPABASE_URL, ANON_KEY);

async function generateMasterReport() {
    console.log("📊 GENERATING MASTER DATA REPORT (Jan 31)...\n");

    const today = new Date();
    const todayStr = '2026-01-31'; // Fixed reference for consistency

    // 1. Fetch ALL Users (Active & Inactive) excluding 'none'
    const { data: users, error } = await supabase
        .from('users')
        .select(`
            id, name, email, plan_name, 
            is_active, is_online,
            valid_until, 
            total_leads_received, leads_today, daily_limit,
            replacement_count, max_replacements
        `)
        .neq('plan_name', 'none')
        .order('plan_name', { ascending: true })
        .order('name', { ascending: true });

    if (error) return console.error(error);

    // 2. Process Data (Group by Plan)
    const grouped = {};
    const summary = {};

    console.log("⏳ Fetching payment stats for " + users.length + " users...");

    // Parallel fetch for speed
    await Promise.all(users.map(async (u) => {
        const plan = u.plan_name || 'Unknown';
        if (!grouped[plan]) grouped[plan] = [];
        if (!summary[plan]) summary[plan] = { total: 0, active: 0, stopped: 0 };

        // Stats Update
        summary[plan].total++;
        if (u.is_active) summary[plan].active++; else summary[plan].stopped++;

        // 1. Check Payments
        const { count: p1 } = await supabase.from('leads').select('id', { count: 'exact', head: true }).eq('user_id', u.id).ilike('status', '%Payment%').not('status', 'ilike', '%Full%'); // Rough approx for 1st
        const { count: p2 } = await supabase.from('leads').select('id', { count: 'exact', head: true }).eq('user_id', u.id).ilike('status', '%Full Payment%');

        u.pay1 = p1 || 0;
        u.pay2 = p2 || 0;

        // 2. Expiry Status
        let status = u.is_active ? "Active ✅" : "Stopped 🛑";
        let action = "-";

        if (u.valid_until) {
            const validDate = new Date(u.valid_until).toISOString().split('T')[0];
            if (u.is_active && validDate <= todayStr) {
                status = "EXPIRED (Active) ⚠️";
                action = "NEED STOP";
            }
            if (!u.is_active && validDate <= todayStr) {
                status = "Expired (Stopped) ✔️";
            }
        }

        u.statusDisplay = status;
        u.actionDisplay = action;
        u.pendingLeads = u.is_active ? (u.daily_limit - u.leads_today) : 0;
        if (u.pendingLeads < 0) u.pendingLeads = 0;

        grouped[plan].push(u);
    }));

    // 3. Print Output
    for (const plan of Object.keys(grouped)) {
        const s = summary[plan];
        console.log(`\n=====================================================================================================`);
        console.log(`📌 PLAN: ${plan.toUpperCase()} (Total: ${s.total} | Active: ${s.active} | Stopped: ${s.stopped})`);
        console.log(`=====================================================================================================`);
        console.log(
            `Name                `.padEnd(20) +
            `| Status             `.padEnd(20) +
            `| Valid Until `.padEnd(12) +
            `| Leads (Tot)`.padEnd(13) +
            `| Today(Pend)`.padEnd(13) +
            `| 1st Pay`.padEnd(9) +
            `| 2nd Pay`.padEnd(9) +
            `| Action`
        );
        console.log("-".repeat(105));

        // Sort: Active first, then by leads
        grouped[plan].sort((a, b) => (b.is_active === a.is_active ? 0 : b.is_active ? 1 : -1));

        grouped[plan].forEach(u => {
            const date = u.valid_until ? new Date(u.valid_until).toLocaleDateString() : 'N/A';
            const pending = u.is_active ? `${u.leads_today}/${u.daily_limit}` : `-`;

            console.log(
                `${u.name.slice(0, 19).padEnd(20)} | ` +
                `${u.statusDisplay.padEnd(18)} | ` +
                `${date.padEnd(11)} | ` +
                `${String(u.total_leads_received).padEnd(11)} | ` +
                `${pending.padEnd(11)} | ` +
                `${String(u.pay1).padEnd(7)} | ` +
                `${String(u.pay2).padEnd(7)} | ` +
                `${u.actionDisplay}`
            );
        });
    }
}

generateMasterReport();
