const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = "https://vewqzsqddgmkslnuctvb.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ1MzA0NjIsImV4cCI6MjA4MDEwNjQ2Mn0.g-e8YNzEy0Z5ul1RGAhBMDj41TtWGuNPEzZz4XEGPg4";

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function diagnose() {
    console.log("🔍 Diagnosing Leads for Himanshu...");

    // 1. Get User
    const { data: user, error: userError } = await supabase
        .from('users')
        .select('id, name')
        .ilike('name', '%Himanshu%')
        .limit(1)
        .single();

    if (userError || !user) {
        console.error("❌ User found error:", userError);
        return;
    }

    console.log(`👤 Found User: ${user.name} (${user.id})`);

    // 2. Fetch ALL leads for this user
    // Note: Using loop to bypass 1000 limit just in case, though 209 is low.
    let allLeads = [];
    let page = 0;
    const pageSize = 1000;

    while (true) {
        const { data, error } = await supabase
            .from('leads')
            .select('id, status, user_id, assigned_to')
            .eq('user_id', user.id)
            .range(page * pageSize, (page + 1) * pageSize - 1);

        if (error) {
            console.error("❌ Lead fetch error:", error);
            break;
        }

        if (!data || data.length === 0) break;

        allLeads = [...allLeads, ...data];
        if (data.length < pageSize) break;
        page++;
    }

    console.log(`📊 Total Leads in DB (user_id match): ${allLeads.length}`);

    // 3. Breakdown by Status
    const statusCounts = {};
    allLeads.forEach(l => {
        statusCounts[l.status] = (statusCounts[l.status] || 0) + 1;
    });

    console.log("📈 Status Breakdown:", statusCounts);

    // 4. Check for leads assigned but not user_id
    const { count, error: countError } = await supabase
        .from('leads')
        .select('*', { count: 'exact', head: true })
        .eq('assigned_to', user.id)
        .neq('user_id', user.id); // Mismatch

    if (countError) console.error("❌ Mismatch check error:", countError);
    console.log(`⚠️ Leads with assigned_to=${user.id} BUT user_id!=ID: ${count}`);

}

diagnose();
