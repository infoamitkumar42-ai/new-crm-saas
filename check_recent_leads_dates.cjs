const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const SUPABASE_URL = "https://vewqzsqddgmkslnuctvb.supabase.co";
const SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDUzMDQ2MiwiZXhwIjoyMDgwMTA2NDYyfQ.pAgMGN6MtKm1A3fsKr1GIt8-qmKYhwFjSt92L_6_7us";

const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

async function main() {
    console.log("Fetching exact users named Chirag...");
    const { data: users, error: uErr } = await supabase
        .from('users')
        .select('id, name')
        .ilike('name', '%Chirag%');

    if (uErr) {
        console.error("Error fetching users:", uErr.message);
        return;
    }
    const chiragIds = users.filter(u => u.name && u.name.toLowerCase().includes('chirag')).map(u => u.id);

    // Look for EXACTLY 17 leads from yesterday or just recent 17 unassigned?
    // Let's just find ANY leads belonging to Chirag (assigned_to = chirag ID)
    let { data: chiragLeads, error: clErr } = await supabase
        .from('leads')
        .select('*')
        .in('assigned_to', chiragIds)
        .order('created_at', { ascending: false })
        .limit(100);

    if (clErr) {
        console.error("Error fetching leads:", clErr.message);
        return;
    }

    console.log(`\nFound ${chiragLeads.length} leads assigned to Chirag.`);

    // Check if there's an Exact 17 leads created on a specific date:
    const groups = {};
    chiragLeads.forEach(l => {
        const d = l.created_at.split('T')[0];
        groups[d] = (groups[d] || 0) + 1;
    });
    console.log("\nGrouped by created_at Date:", groups);

    // Filter to those 17 leads (if we find the group)
    const exact17Date = Object.keys(groups).find(k => groups[k] === 17);
    let targetLeads = [];
    if (exact17Date) {
        targetLeads = chiragLeads.filter(l => l.created_at.startsWith(exact17Date));
        console.log(`\nFound EXACTLY 17 leads for date: ${exact17Date}`);
    } else if (chiragLeads.length === 17) {
        targetLeads = chiragLeads;
        console.log(`\nFound EXACTLY 17 leads assigned to Chirag in total.`);
    } else if (chiragLeads.length > 17) {
        // Just take 17
        targetLeads = chiragLeads.slice(0, 17);
        console.log(`\nTaking the top 17 out of ${chiragLeads.length} leads for Chirag.`);
    }

    if (targetLeads.length > 0) {
        fs.writeFileSync('chirag_17_leads.json', JSON.stringify(targetLeads, null, 2));
    }
}

main().catch(console.error);
