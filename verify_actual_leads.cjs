const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://vewqzsqddgmkslnuctvb.supabase.co';
const ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ1MzA0NjIsImV4cCI6MjA4MDEwNjQ2Mn0.g-e8YNzEy0Z5ul1RGAhBMDj41TtWGuNPEzZz4XEGPg4";

const supabase = createClient(SUPABASE_URL, ANON_KEY);

// Official Plan Limits
const PLAN_LIMITS = {
    'starter': 55,
    'supervisor': 115,
    'manager': 176,
    'weekly_boost': 92,
    'turbo_boost': 108
};

async function verifyActualLeads() {
    console.log("🔍 VERIFYING ACTUAL LEADS FROM LEADS TABLE\n");

    // Fetch stopped users with 1 payment
    const { data: users } = await supabase
        .from('users')
        .select('id, name, plan_name, is_active, total_leads_received')
        .eq('is_active', false)
        .neq('plan_name', 'none')
        .order('name', { ascending: true });

    // Fetch ALL leads
    const { data: leads } = await supabase
        .from('leads')
        .select('user_id, assigned_to');

    // Count actual leads per user
    const leadCountMap = new Map();
    (leads || []).forEach(l => {
        const id = l.user_id || l.assigned_to;
        if (id) {
            leadCountMap.set(id, (leadCountMap.get(id) || 0) + 1);
        }
    });

    console.log(`| #  | Name                   | Plan         | DB Field | ACTUAL Leads | Limit | Status      |`);
    console.log(`|----|------------------------|--------------|----------|--------------|-------|-------------|`);

    let matchCount = 0;
    let mismatchCount = 0;
    let deliveredComplete = 0;

    users.forEach((u, i) => {
        const dbCount = u.total_leads_received || 0;
        const actualCount = leadCountMap.get(u.id) || 0;
        const limit = PLAN_LIMITS[u.plan_name] || 55;

        let status = '';
        if (actualCount >= limit) {
            status = '✅ COMPLETE';
            deliveredComplete++;
        } else {
            status = `⚠️ ${limit - actualCount} pending`;
        }

        if (dbCount !== actualCount) {
            mismatchCount++;
            status += ' (MISMATCH!)';
        } else {
            matchCount++;
        }

        console.log(`| ${String(i + 1).padEnd(2)} | ${(u.name || 'Unknown').padEnd(22)} | ${(u.plan_name || '-').padEnd(12)} | ${String(dbCount).padEnd(8)} | ${String(actualCount).padEnd(12)} | ${String(limit).padEnd(5)} | ${status} |`);
    });

    console.log(`\n==========================================================`);
    console.log(`📊 SUMMARY`);
    console.log(`==========================================================`);
    console.log(`Total Stopped Users:       ${users.length}`);
    console.log(`Delivered Complete:        ${deliveredComplete}`);
    console.log(`DB Field Matches Actual:   ${matchCount}`);
    console.log(`DB Field MISMATCH:         ${mismatchCount}`);
}

verifyActualLeads();
