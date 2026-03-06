const SUPABASE_URL = "https://api.leadflowcrm.in";
const SUPABASE_SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDUzMDQ2MiwiZXhwIjoyMDgwMTA2NDYyfQ.pAgMGN6MtKm1A3fsKr1GIt8-qmKYhwFjSt92L_6_7us";
const fs = require('fs');

async function run() {
    const todayStartUTC = '2026-03-02T18:30:00Z';
    const todayEndUTC = '2026-03-03T18:30:00Z';

    const url = `${SUPABASE_URL}/rest/v1/leads?select=*&created_at=gte.${todayStartUTC}&created_at=lte.${todayEndUTC}&order=created_at.desc`;
    const resp = await fetch(url, {
        headers: { 'apikey': SUPABASE_SERVICE_ROLE_KEY, 'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}` }
    });
    const leads = await resp.json();
    if (!Array.isArray(leads)) { console.error("❌", leads); return; }

    // All are Himanshu's pages — make CSV
    const headers = ['Name', 'Phone', 'Email', 'City', 'State', 'Status', 'Page Name', 'Assigned To', 'Created At (IST)'];
    const rows = leads.map(l => {
        const ist = new Date(l.created_at).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });
        return [
            `"${(l.name || '').replace(/"/g, '""')}"`,
            l.phone || '',
            l.email || '',
            `"${(l.city || '').replace(/"/g, '""')}"`,
            `"${(l.state || '').replace(/"/g, '""')}"`,
            l.status || '',
            `"${(l.page_name || '').replace(/"/g, '""')}"`,
            l.assigned_to || '',
            `"${ist}"`
        ].join(',');
    });

    const csv = [headers.join(','), ...rows].join('\n');
    const csvPath = 'c:\\Users\\HP\\Downloads\\new-crm-saas\\today_leads_march3_himanshu.csv';
    fs.writeFileSync(csvPath, csv, 'utf8');
    console.log(`✅ CSV saved: ${csvPath} (${leads.length} leads)`);
    console.log("\n📋 Lead details:");
    leads.forEach((l, i) => {
        const ist = new Date(l.created_at).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });
        console.log(`${i + 1}. ${l.name} | ${l.phone} | ${l.page_name} | ${ist}`);
    });
}
run().catch(console.error);
