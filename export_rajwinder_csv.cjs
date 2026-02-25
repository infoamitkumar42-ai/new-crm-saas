const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const SUPABASE_URL = "https://vewqzsqddgmkslnuctvb.supabase.co";
const SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDUzMDQ2MiwiZXhwIjoyMDgwMTA2NDYyfQ.pAgMGN6MtKm1A3fsKr1GIt8-qmKYhwFjSt92L_6_7us";
const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

async function main() {
    console.log("📊 Exporting TEAMRAJ ALL leads CSV...\n");

    const { data: teamUsers } = await supabase.from('users')
        .select('id, name, email, plan_name, is_active')
        .eq('team_code', 'TEAMRAJ');

    console.log(`Team Members: ${teamUsers.length}`);

    let allLeads = [];
    for (let u of teamUsers) {
        let page = 0, hasMore = true;
        while (hasMore) {
            const { data: leads, error } = await supabase.from('leads')
                .select('id, name, phone, city, state, source, status, created_at, assigned_at')
                .or(`assigned_to.eq.${u.id},user_id.eq.${u.id}`)
                .order('created_at', { ascending: true })
                .range(page * 500, (page + 1) * 500 - 1);

            if (error) { console.log(`  Error: ${error.message}`); hasMore = false; continue; }
            if (leads && leads.length > 0) {
                leads.forEach(l => { l._userName = u.name; l._plan = u.plan_name; });
                allLeads = allLeads.concat(leads);
                hasMore = leads.length === 500;
                page++;
            } else { hasMore = false; }
        }
        const cnt = allLeads.filter(l => l._userName === u.name).length;
        console.log(`  ${u.name} (${u.plan_name || 'N/A'}): ${cnt} leads`);
    }

    const seen = new Set();
    allLeads = allLeads.filter(l => { if (seen.has(l.id)) return false; seen.add(l.id); return true; });
    console.log(`\nTotal Unique Leads: ${allLeads.length}`);

    let csv = "Assigned To,Plan,Lead Name,Phone,City,State,Source,Status,Created Date,Assigned Date\n";
    allLeads.forEach(l => {
        const fmt = (d) => {
            if (!d) return '';
            return new Date(d).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });
        };
        csv += `"${l._userName}","${l._plan || ''}","${(l.name || '').replace(/"/g, "'")}","${l.phone || ''}","${l.city || ''}","${l.state || ''}","${(l.source || '').replace(/"/g, "'")}","${l.status || ''}","${fmt(l.created_at)}","${fmt(l.assigned_at)}"\n`;
    });

    fs.writeFileSync('TEAMRAJ_rajwinder_ALL_leads.csv', csv);
    console.log("\n✅ CSV saved: TEAMRAJ_rajwinder_ALL_leads.csv");
}

main().catch(console.error);
