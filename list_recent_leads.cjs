const { createClient } = require('@supabase/supabase-js');

// Config
const SUPABASE_URL = 'https://vewqzsqddgmkslnuctvb.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY; // I need the Service Key to see all data

if (!SUPABASE_KEY) {
    console.error("❌ Error: SUPABASE_SERVICE_ROLE_KEY is missing in environment variables.");
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function listRecentLeads() {
    console.log("🔍 Fetching last 5 leads...");

    const { data: leads, error } = await supabase
        .from('leads')
        .select('id, name, phone, status, user_id, created_at')
        .order('created_at', { ascending: false })
        .limit(5);

    if (error) {
        console.error("Error fetching leads:", error);
        return;
    }

    if (leads.length === 0) {
        console.log("No leads found.");
        return;
    }

    console.log("\n📋 Recent Leads:");
    console.table(leads);
}

listRecentLeads();
