const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = "https://vewqzsqddgmkslnuctvb.supabase.co";
const SUPABASE_SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDUzMDQ2MiwiZXhwIjoyMDgwMTA2NDYyfQ.pAgMGN6MtKm1A3fsKr1GIt8-qmKYhwFjSt92L_6_7us";

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function generateHimanshuReport() {
    console.log("📊 GENERATING HIMANSHU TEAM DASHBOARD REPORT...");

    // 1. Identify Himanshu and Team
    const { data: managers } = await supabase
        .from('users')
        .select('id, name, team_code')
        .ilike('name', '%Himanshu%');

    if (!managers || managers.length === 0) {
        console.error("❌ Could not find Himanshu's manager record.");
        return;
    }

    const managerIds = managers.map(m => m.id);
    const teamCodes = managers.map(m => m.team_code).filter(Boolean);

    // 2. Fetch all members (excluding Himanshu himself and other managers)
    const { data: users, error } = await supabase
        .from('users')
        .select(`
            id, 
            name, 
            email, 
            team_code, 
            daily_limit, 
            is_active, 
            is_online, 
            payment_status,
            role
        `)
        .or(`manager_id.in.(${managerIds.join(',')}),team_code.in.(${teamCodes.join(',')})`)
        .eq('role', 'member')
        .order('name', { ascending: true });

    if (error) {
        console.error("❌ Error fetching users:", error.message);
        return;
    }

    // 3. Get Today's Date in IST format for precise lead counting
    const options = { timeZone: 'Asia/Kolkata', year: 'numeric', month: '2-digit', day: '2-digit' };
    const todayIST = new Intl.DateTimeFormat('en-CA', options).format(new Date());

    // 4. Fetch leads assigned to these users
    const { data: leadsToday, error: leadsError } = await supabase
        .from('leads')
        .select('assigned_to, created_at')
        .in('assigned_to', users.map(u => u.id));

    const leadsByUserId = {};
    if (leadsToday) {
        leadsToday.forEach(l => {
            const leadDateIST = new Intl.DateTimeFormat('en-CA', options).format(new Date(l.created_at));
            if (leadDateIST === todayIST) {
                leadsByUserId[l.assigned_to] = (leadsByUserId[l.assigned_to] || 0) + 1;
            }
        });
    }

    // 5. Categorize and Analyze
    const paidActiveMembers = users.filter(u => u.payment_status === 'active' && u.is_active);
    const offlineOrPaused = paidActiveMembers.filter(u => !u.is_online);
    const onlineAndReady = paidActiveMembers.filter(u => u.is_online);

    let totalDelivered = 0;
    let totalDemand = 0;
    let onlineDemand = 0;

    paidActiveMembers.forEach(u => {
        const delivered = leadsByUserId[u.id] || 0;
        const demand = Math.max(0, (u.daily_limit || 0) - delivered);
        totalDelivered += delivered;
        totalDemand += demand;
        if (u.is_online) onlineDemand += demand;
    });

    console.log(`\n📅 DATE (IST): ${todayIST}`);
    console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
    console.log(`👥 TOTAL PAID ACTIVE MEMBERS: ${paidActiveMembers.length}`);
    console.log(`✅ ONLINE & READY         : ${onlineAndReady.length}`);
    console.log(`💤 OFFLINE / PAUSED       : ${offlineOrPaused.length}`);
    console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
    console.log(`📈 LEADS DELIVERED TODAY  : ${totalDelivered}`);
    console.log(`🎯 TOTAL REMAINING DEMAND : ${totalDemand} (if all were online)`);
    console.log(`🔥 CURRENT ONLINE DEMAND  : ${onlineDemand} (Leads needed NOW)`);
    console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);

    console.log(`\n📋 MEMBER BREAKDOWN (Paid & Active):`);
    console.log(`Name                      | Status   | Limit | Delivered | Needed`);
    console.log(`--------------------------|----------|-------|-----------|-------`);
    paidActiveMembers.forEach(u => {
        const delivered = leadsByUserId[u.id] || 0;
        const needed = Math.max(0, (u.daily_limit || 0) - delivered);
        const status = u.is_online ? 'ONLINE' : 'OFFLINE';
        console.log(`${u.name.padEnd(25)} | ${status.padEnd(8)} | ${String(u.daily_limit).padStart(5)} | ${String(delivered).padStart(9)} | ${String(needed).padStart(6)}`);
    });
}

generateHimanshuReport();
