
const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://vewqzsqddgmkslnuctvb.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDUzMDQ2MiwiZXhwIjoyMDgwMTA2NDYyfQ.pAgMGN6MtKm1A3fsKr1GIt8-qmKYhwFjSt92L_6_7us';
const supabase = createClient(supabaseUrl, supabaseKey);

async function calculateQuota() {
    console.log("📊 Calculating Total Remaining Quota for Today...\n");

    const { data: users, error } = await supabase
        .from('users')
        .select('name, leads_today, daily_limit')
        .eq('is_active', true)
        .neq('plan_name', 'none')
        .or('is_plan_pending.is.null,is_plan_pending.eq.false');

    if (error) { console.error("❌ Error:", error); return; }

    let totalNeeded = 0;
    let totalCapacity = 0;
    let usersPending = 0;

    users.forEach(u => {
        const limit = u.daily_limit || 0;
        const current = u.leads_today || 0;
        const remaining = Math.max(0, limit - current);

        totalCapacity += limit;
        if (remaining > 0) {
            totalNeeded += remaining;
            usersPending++;
        }
    });

    console.log(`📉 Total Daily Capacity: ${totalCapacity}`);
    console.log(`🛑 Total Leads Needed: ${totalNeeded}`);
    console.log(`👥 Users Waiting: ${usersPending}/${users.length}`);
    console.log("------------------------------------------------");
}

calculateQuota();
