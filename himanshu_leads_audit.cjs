
const { createClient } = require('@supabase/supabase-js');
const SUPABASE_URL = 'https://vewqzsqddgmkslnuctvb.supabase.co';
const ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ1MzA0NjIsImV4cCI6MjA4MDEwNjQ2Mn0.g-e8YNzEy0Z5ul1RGAhBMDj41TtWGuNPEzZz4XEGPg4";
const supabase = createClient(SUPABASE_URL, ANON_KEY);

async function himanshuLeadsAudit() {
    // 1. Get Himanshu's Page IDs
    const { data: pages } = await supabase
        .from('meta_pages')
        .select('page_id, page_name')
        .eq('team_id', 'TEAMFIRE');

    if (!pages || pages.length === 0) {
        console.log("No pages found for TEAMFIRE (Himanshu).");
        return;
    }

    const pageIds = pages.map(p => p.page_id);
    const pageNames = pages.map(p => `Meta - ${p.page_name}`);

    console.log(`🔍 Checking leads for Team: TEAMFIRE (Himanshu)`);
    console.log(`📄 Pages: ${pages.map(p => p.page_name).join(', ')}\n`);

    // 2. Get leads from these pages today
    const today = new Date().toISOString().split('T')[0];
    const { data: leads, error } = await supabase
        .from('leads')
        .select('id, name, status, source, assigned_to, created_at')
        .in('source', pageNames)
        .gte('created_at', today + 'T00:00:00Z')
        .order('created_at', { ascending: false });

    if (error) {
        console.error("❌ Error fetching leads:", error);
        return;
    }

    if (!leads || leads.length === 0) {
        console.log("📭 No leads found from Himanshu's pages today.");
        return;
    }

    // 3. Get user details
    const userIds = [...new Set(leads.map(l => l.assigned_to).filter(id => id))];
    const { data: users } = await supabase.from('users').select('id, name, email, team_code').in('id', userIds);
    const userMap = users?.reduce((acc, u) => ({ ...acc, [u.id]: u }), {}) || {};

    console.log(`Total Leads found: ${leads.length}\n`);
    leads.forEach((l, i) => {
        const u = userMap[l.assigned_to];
        console.log(`${i + 1}. [${new Date(l.created_at).toLocaleTimeString()}] Lead: ${l.name}`);
        console.log(`   - 📢 Source: ${l.source}`);
        console.log(`   - 👤 Assigned To: ${u ? u.name + " (" + u.team_code + ")" : "UNASSIGNED"}`);
        console.log("   ------------------------------------------------");
    });
}

himanshuLeadsAudit();
