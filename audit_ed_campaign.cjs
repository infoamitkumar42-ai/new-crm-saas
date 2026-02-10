const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = "https://vewqzsqddgmkslnuctvb.supabase.co";
const SUPABASE_SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDUzMDQ2MiwiZXhwIjoyMDgwMTA2NDYyfQ.pAgMGN6MtKm1A3fsKr1GIt8-qmKYhwFjSt92L_6_7us";

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function auditEDCampaign() {
    console.log("🔍 Auditing ED Campaign (18 Designated Users)...");

    const emails = [
        'ludhranimohit91@gmail.com', 'dineshmonga22@gmail.com', 'dhawantanu536@gmail.com',
        'harmandeepkaurmanes790@gmail.com', 'payalpuri3299@gmail.com', 'vansh.rajni.96@gmail.com',
        'rupanasameer551@gmail.com', 'loveleenkaur8285@gmail.com', 'rohitgagneja69@gmail.com',
        'rasganiya98775@gmail.com', 'jerryvibes.444@gmail.com', 'brark5763@gmail.com',
        'sharmahimanshu9797@gmail.com', 'rrai26597@gmail.com', 'samandeepkaur1216@gmail.com',
        'dbrar8826@gmail.com', 'nehagoyal36526@gmail.com', 'rahulkumarrk1111@gmail.com'
    ];

    // 1. Fetch User Data
    const { data: users, error: userError } = await supabase
        .from('users')
        .select('id, name, email, leads_today, is_online, is_active, preferred_form_ids')
        .in('email', emails);

    if (userError) {
        console.error("❌ Error fetching users:", userError.message);
        return;
    }

    // 2. Fetch Todays Leads for these users
    const startOfDay = new Date();
    startOfDay.setUTCHours(0, 0, 0, 0);

    const userIds = users.map(u => u.id);
    const { data: leads, error: leadError } = await supabase
        .from('leads')
        .select('assigned_to, source, created_at')
        .in('assigned_to', userIds)
        .gte('created_at', startOfDay.toISOString());

    if (leadError) {
        console.error("❌ Error fetching leads:", leadError.message);
        return;
    }

    console.log(`\n📊 ED CAMPAIGN SUMMARY (Today):`);
    console.log(`- Target Form ID: 1282140203730435`);
    console.log(`- Users in Campaign: ${users.length}/18 found.`);
    console.log(`- Total Leads Received by these 18 users Today: ${leads.length}`);

    const stats = {};
    users.forEach(u => stats[u.id] = { name: u.name, leads: 0, edLeads: 0, online: u.is_online });

    leads.forEach(l => {
        if (stats[l.assigned_to]) {
            stats[l.assigned_to].leads++;
            // Check if it's the specific source
            if (l.source && l.source.includes('Himanshu Sharma 2')) {
                stats[l.assigned_to].edLeads++;
            }
        }
    });

    console.log(`\n📋 USER WISE BREAKDOWN:`);
    console.log(`Name                 | Online | Total Leads | ED Leads`);
    console.log(`---------------------|--------|-------------|-----------`);

    Object.values(stats).sort((a, b) => b.leads - a.leads).forEach(s => {
        console.log(`${s.name.padEnd(20)} | ${s.online ? 'YES   ' : 'NO    '} | ${s.leads.toString().padEnd(11)} | ${s.edLeads}`);
    });

    const activeCount = users.filter(u => u.is_online && u.is_active).length;
    console.log(`\n💡 Active/Online Researchers: ${activeCount}`);
    if (activeCount < users.length) {
        console.log(`⚠️ Note: ${users.length - activeCount} users are offline/inactive and cannot receive leads.`);
    }
}

auditEDCampaign();
