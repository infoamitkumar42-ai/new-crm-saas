const fetch = require('node-fetch');

const SUPABASE_URL = "https://api.leadflowcrm.in";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ1MzA0NjIsImV4cCI6MjA4MDEwNjQ2Mn0.g-e8YNzEy0Z5ul1RGAhBMDj41TtWGuNPEzZz4XEGPg4";

async function checkOrphans() {
    console.log("🔍 Checking Orphan Leads (assigned_to is NULL)...");

    try {
        // 1. Total orphans
        const totalResp = await fetch(`${SUPABASE_URL}/rest/v1/leads?select=count&assigned_to=is.null`, {
            headers: {
                'apikey': SUPABASE_ANON_KEY,
                'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
                'Prefer': 'count=exact'
            }
        });
        const totalCount = totalResp.headers.get('content-range')?.split('/')[1] || '0';
        console.log(`📊 Total Orphan Leads: ${totalCount}`);

        // 2. Orphans by date (created_at)
        console.log("\n📅 Orphans by Creation Date (Last 7 days):");
        const dateQuery = await fetch(`${SUPABASE_URL}/rest/v1/leads?select=created_at&assigned_to=is.null&order=created_at.desc`, {
            headers: {
                'apikey': SUPABASE_ANON_KEY,
                'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
            }
        });
        const leads = await dateQuery.json();

        const countsByDate = {};
        leads.forEach(lead => {
            const date = lead.created_at.split('T')[0];
            countsByDate[date] = (countsByDate[date] || 0) + 1;
        });

        Object.entries(countsByDate).forEach(([date, count]) => {
            console.log(`${date}: ${count} leads`);
        });

        // 3. Specifically look for March 1st and Feb 28th
        console.log("\n🔎 Specifically checking March 1st and Feb 28th...");
        const mar1 = countsByDate['2026-03-01'] || 0;
        const feb28 = countsByDate['2026-02-28'] || 0;
        console.log(`March 1st: ${mar1} orphans`);
        console.log(`Feb 28th: ${feb28} orphans`);

    } catch (err) {
        console.error("❌ Error fetching data:", err);
    }
}

checkOrphans();
