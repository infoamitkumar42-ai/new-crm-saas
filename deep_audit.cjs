
const { createClient } = require('@supabase/supabase-js');
const SUPABASE_URL = 'https://vewqzsqddgmkslnuctvb.supabase.co';
const ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ1MzA0NjIsImV4cCI6MjA4MDEwNjQ2Mn0.g-e8YNzEy0Z5ul1RGAhBMDj41TtWGuNPEzZz4XEGPg4";
const supabase = createClient(SUPABASE_URL, ANON_KEY);

async function deepAudit() {
    console.log("🔍 --- DEEP AUDIT: TEAM-WISE LEAD DISTRIBUTION --- 🔍\n");
    const today = new Date().toISOString().split('T')[0];

    // 1. Get all leads for today
    const { data: leads, error: leadError } = await supabase
        .from('leads')
        .select('name, phone, source, assigned_to, created_at')
        .gte('created_at', today + 'T00:00:00Z')
        .order('created_at', { ascending: false });

    if (leadError) {
        console.error("Error fetching leads:", leadError);
        return;
    }

    // 2. Get all users and their teams
    const { data: users, error: userError } = await supabase
        .from('users')
        .select('id, name, team_code');

    if (userError) {
        console.error("Error fetching users:", userError);
        return;
    }

    const userMap = users.reduce((acc, u) => ({ ...acc, [u.id]: u }), {});

    // 3. Define Team Mappings for Sources (based on user info)
    // We'll categorize leads based on their source string
    const report = {
        RAJ_LEADS: [],
        HIMANSHU_LEADS: [],
        CHIRAG_LEADS: [],
        OTHER: []
    };

    leads.forEach(l => {
        const assignedUser = userMap[l.assigned_to];
        const leadInfo = {
            name: l.name,
            phone: l.phone,
            source: l.source,
            assignedTo: assignedUser ? `${assignedUser.name} (${assignedUser.team_code})` : 'UNASSIGNED',
            time: new Date(l.created_at).toLocaleTimeString()
        };

        const src = l.source.toLowerCase();
        if (src.includes('rajwinder')) {
            report.RAJ_LEADS.push(leadInfo);
        } else if (src.includes('himanshu') || src.includes('landing page')) {
            report.HIMANSHU_LEADS.push(leadInfo);
        } else if (src.includes('new cbo') || src.includes('chirag') || src.includes('bhumit')) {
            report.CHIRAG_LEADS.push(leadInfo);
        } else {
            report.OTHER.push(leadInfo);
        }
    });

    console.log(`TOTAL LEADS FOUND TODAY: ${leads.length}\n`);

    console.log("📍 RAJWINDER'S LEADS (Source contains 'rajwinder'):");
    console.table(report.RAJ_LEADS);

    console.log("\n📍 HIMANSHU'S LEADS (Source contains 'himanshu' or 'landing'):");
    console.table(report.HIMANSHU_LEADS);

    console.log("\n📍 CHIRAG'S LEADS (Source contains 'new cbo', 'chirag', 'bhumit'):");
    console.table(report.CHIRAG_LEADS);

    console.log("\n📍 OTHER/UNKNOWN LEADS:");
    console.table(report.OTHER);

    // 4. Check meta_pages mapping
    console.log("\n🗺️ CURRENT PAGE-TO-TEAM MAPPINGS IN DATABASE:");
    const { data: mappings } = await supabase.from('meta_pages').select('*');
    console.table(mappings);
}

deepAudit();
