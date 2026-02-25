const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = "https://vewqzsqddgmkslnuctvb.supabase.co";
const SUPABASE_SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDUzMDQ2MiwiZXhwIjoyMDgwMTA2NDYyfQ.pAgMGN6MtKm1A3fsKr1GIt8-qmKYhwFjSt92L_6_7us";

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function finalReport() {
    const options = { timeZone: 'Asia/Kolkata', year: 'numeric', month: '2-digit', day: '2-digit' };
    const todayIST = new Intl.DateTimeFormat('en-CA', options).format(new Date());

    // 1. Get all users in Himanshu's teams
    const { data: users } = await supabase
        .from('users')
        .select('id, name, team_code, payment_status, is_active, daily_limit, is_online')
        .or('team_code.eq.TEAMFIRE,team_code.eq.GJ01TEAMFIRE');

    const activePaid = users.filter(u => u.payment_status === 'active' && u.is_active);
    const userIds = activePaid.map(u => u.id);

    // 2. Count leads assigned to these users TODAY
    const { data: leads } = await supabase
        .from('leads')
        .select('assigned_to, created_at, status')
        .in('assigned_to', userIds);

    const counts = {};
    leads.forEach(l => {
        const leadDateIST = new Intl.DateTimeFormat('en-CA', options).format(new Date(l.created_at));
        if (leadDateIST === todayIST) {
            counts[l.assigned_to] = (counts[l.assigned_to] || 0) + 1;
        }
    });

    let totalDelivered = 0;
    activePaid.forEach(u => {
        totalDelivered += (counts[u.id] || 0);
    });

    console.log(`\n📊 FINAL AUDIT FOR HIMANSHU TEAMS (TEAMFIRE & GJ01TEAMFIRE):`);
    console.log(`- TOTAL ACTIVE PAID MEMBERS: ${activePaid.length}`);
    console.log(`- TOTAL LEADS DELIVERED TO THEM TODAY (IST): ${totalDelivered}`);

    // 3. Check for Queued leads for his pages
    const { data: qLeads } = await supabase
        .from('leads')
        .select('id, created_at, source')
        .eq('status', 'Queued');

    const himanshuQueued = qLeads.filter(l => {
        const leadDateIST = new Intl.DateTimeFormat('en-CA', options).format(new Date(l.created_at));
        return leadDateIST === todayIST && (l.source?.includes('Himanshu') || l.source?.includes('TFE') || l.source?.includes('Bhumit'));
    });

    console.log(`- TOTAL QUEUED (STUCK) LEADS FOR HIS PAGES TODAY: ${himanshuQueued.length}`);

    // 4. Check for Invalid leads for his pages
    const { data: iLeads } = await supabase
        .from('leads')
        .select('id, created_at, source')
        .eq('status', 'Invalid');

    const himanshuInvalid = iLeads.filter(l => {
        const leadDateIST = new Intl.DateTimeFormat('en-CA', options).format(new Date(l.created_at));
        return leadDateIST === todayIST && (l.source?.includes('Himanshu') || l.source?.includes('TFE') || l.source?.includes('Bhumit'));
    });

    console.log(`- TOTAL INVALID (REJECTED) LEADS FOR HIS PAGES TODAY: ${himanshuInvalid.length}`);

    console.log(`\n💡 EXPLANATION:`);
    console.log(`Himanshu says Ad Manager shows 419 leads.`);
    console.log(`System shows: ${totalDelivered} Delivered + ${himanshuQueued.length} Queued + ${himanshuInvalid.length} Invalid = ${totalDelivered + himanshuQueued.length + himanshuInvalid.length} accounted for.`);
    console.log(`If this total is close to 419, then the system got the leads, but many are stuck or rejected.`);
}

finalReport();
