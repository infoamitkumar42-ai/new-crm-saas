const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://vewqzsqddgmkslnuctvb.supabase.co';
const ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ1MzA0NjIsImV4cCI6MjA4MDEwNjQ2Mn0.g-e8YNzEy0Z5ul1RGAhBMDj41TtWGuNPEzZz4XEGPg4";

const supabase = createClient(SUPABASE_URL, ANON_KEY);

// Official Plan Limits (Total + Replacement = Promised)
const PLAN_LIMITS = {
    'starter': 55,      // 50 + 5
    'supervisor': 115,  // 105 + 10
    'manager': 176,     // 160 + 16
    'weekly_boost': 92, // 84 + 8
    'turbo_boost': 108  // 98 + 10
};

async function checkQuotaCompletion() {
    console.log("🔍 CHECKING USERS TO STOP (Quota Complete)...\n");

    const { data: users, error } = await supabase
        .from('users')
        .select('id, name, plan_name, is_active, total_leads_received, total_leads_promised')
        .neq('plan_name', 'none')
        .order('total_leads_received', { ascending: false });

    if (error) return console.log(error.message);

    let needToStop = [];      // Quota finished, still active
    let alreadyStopped = [];  // Quota finished, already stopped
    let nearingLimit = [];    // 90%+ of quota used

    users.forEach(u => {
        const received = u.total_leads_received || 0;
        const limit = PLAN_LIMITS[u.plan_name] || u.total_leads_promised || 55;
        const remaining = limit - received;
        const percentage = ((received / limit) * 100).toFixed(1);

        if (received >= limit) {
            // QUOTA COMPLETE
            if (u.is_active) {
                needToStop.push({ ...u, limit, remaining, percentage });
            } else {
                alreadyStopped.push({ ...u, limit, remaining, percentage });
            }
        } else if (received >= limit * 0.9) {
            // NEAR LIMIT (90%+)
            nearingLimit.push({ ...u, limit, remaining, percentage });
        }
    });

    console.log(`==========================================================`);
    console.log(`⚠️ USERS TO STOP NOW (Quota Complete but Active): ${needToStop.length}`);
    console.log(`==========================================================`);
    if (needToStop.length > 0) {
        needToStop.forEach(u => {
            console.log(`  🔴 ${u.name.padEnd(22)} | ${u.plan_name.padEnd(12)} | ${u.total_leads_received}/${u.limit} (${u.percentage}%)`);
        });
    } else {
        console.log("  ✅ No users need to be stopped right now.\n");
    }

    console.log(`==========================================================`);
    console.log(`✅ ALREADY STOPPED (Quota Complete): ${alreadyStopped.length}`);
    console.log(`==========================================================`);
    if (alreadyStopped.length > 0) {
        alreadyStopped.forEach(u => {
            console.log(`  ✅ ${u.name.padEnd(22)} | ${u.plan_name.padEnd(12)} | ${u.total_leads_received}/${u.limit}`);
        });
    } else {
        console.log("  ℹ️ No users have completed quota yet.\n");
    }

    console.log(`==========================================================`);
    console.log(`⏳ NEARING LIMIT (90%+ Used): ${nearingLimit.length}`);
    console.log(`==========================================================`);
    if (nearingLimit.length > 0) {
        nearingLimit.forEach(u => {
            console.log(`  🟠 ${u.name.padEnd(22)} | ${u.plan_name.padEnd(12)} | ${u.total_leads_received}/${u.limit} | Remaining: ${u.remaining}`);
        });
    } else {
        console.log("  ℹ️ No users are near their limit yet.\n");
    }

    console.log(`\n📊 SUMMARY:`);
    console.log(`  - Need to Stop:        ${needToStop.length}`);
    console.log(`  - Already Stopped:     ${alreadyStopped.length}`);
    console.log(`  - Nearing Limit (90%+): ${nearingLimit.length}`);
}

checkQuotaCompletion();
