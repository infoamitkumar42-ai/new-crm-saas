const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://vewqzsqddgmkslnuctvb.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDUzMDQ2MiwiZXhwIjoyMDgwMTA2NDYyfQ.pAgMGN6MtKm1A3fsKr1GIt8-qmKYhwFjSt92L_6_7us';
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function calculateDemand() {
    const today = new Date().toISOString().split('T')[0] + 'T00:00:00.000Z';
    const teamCode = 'GJ01TEAMFIRE';

    console.log(`--- 🔍 DETAILED SYSTEM AUDIT: TEAM ${teamCode} ---`);

    // 1. Get Chirag's Page IDs
    const { data: pages } = await supabase.from('meta_pages').select('page_id').eq('team_id', teamCode);
    const pageIds = pages.map(p => p.page_id);
    console.log(`Pages tracked for this team: ${pageIds.join(', ')}`);

    // 2. Leads Generated Today from these pages
    const { count: genToday } = await supabase
        .from('leads')
        .select('*', { count: 'exact', head: true })
        .in('page_id', pageIds)
        .gte('created_at', today);

    // 3. Fetch All Users in Team
    const { data: users, error } = await supabase
        .from('users')
        .select('id, name, email, daily_limit, is_active, plan_name, is_plan_pending')
        .eq('team_code', teamCode);

    if (error) {
        console.error(error);
        return;
    }

    let totalActive = 0;
    let totalDemand = 0;
    let zeroLeadPaid = 0;
    let zeroLeadNonPaid = 0;
    const zeroLeadUsers = [];

    for (const user of users) {
        if (!user.is_active || user.is_plan_pending) continue;

        totalActive++;

        // Get count today
        const { count: leadsToday } = await supabase
            .from('leads')
            .select('*', { count: 'exact', head: true })
            .eq('assigned_to', user.id)
            .gte('created_at', today);

        const limit = user.daily_limit || 0;
        const received = leadsToday || 0;
        const remainingForToday = Math.max(0, limit - received);
        totalDemand += remainingForToday;

        if (received === 0) {
            const isPaid = user.plan_name && user.plan_name !== 'none';
            if (isPaid) zeroLeadPaid++;
            else zeroLeadNonPaid++;
            zeroLeadUsers.push({ name: user.name, plan: user.plan_name });
        }
    }

    console.log(`\n--- 📊 STATS FOR TODAY ---`);
    console.log(`✅ Leads Generated from Chirag's Pages: ${genToday}`);
    console.log(`👥 Total Active Members in Team: ${totalActive}`);
    console.log(`🎯 Total Demand (Leads still needed today): ${totalDemand}`);

    console.log(`\n--- 📉 ZERO LEAD USERS BREAKDOWN ---`);
    console.log(`Paid Users with 0 Leads: ${zeroLeadPaid}`);
    console.log(`Non-Paid Users with 0 Leads: ${zeroLeadNonPaid}`);

    if (zeroLeadUsers.length > 0) {
        console.log(`Names: ${zeroLeadUsers.slice(0, 10).map(u => u.name).join(', ')}${zeroLeadUsers.length > 10 ? '...' : ''}`);
    }

    console.log(`\n--- 💡 INSIGHT ---`);
    if (totalDemand > 0) {
        console.log(`Hume aaj ${totalDemand} aur leads generate karni hongi sabka daily quota poora karne ke liye.`);
    } else {
        console.log(`Aaj ki sabki daily limit poori ho chuki hai!`);
    }
}

calculateDemand();
