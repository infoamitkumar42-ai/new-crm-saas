
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const SUPABASE_URL = 'https://vewqzsqddgmkslnuctvb.supabase.co';
const SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDUzMDQ2MiwiZXhwIjoyMDgwMTA2NDYyfQ.pAgMGN6MtKm1A3fsKr1GIt8-qmKYhwFjSt92L_6_7us";

const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

async function recoverAndExport() {
    console.log("🕵️‍♂️ RECOVERING & EXPORTING MANUAL LEADS (From 954 Unassigned Pool)...\n");

    const { data: leads } = await supabase.from('leads')
        .select('*')
        .is('assigned_to', null)
        .gte('created_at', '2026-01-01T00:00:00');

    if (!leads || leads.length === 0) return console.log("No NULL leads found.");

    // Targets
    const targets = {
        'Rajwinder': [],
        'Gurnam': [],
        'Sandeep': [],
        'Rajni': []
    };

    let matchedCount = 0;

    leads.forEach(l => {
        const text = ((l.source || '') + ' ' + (l.notes || '') + ' ' + (l.name || '')).toLowerCase();

        if (text.includes('rajwinder')) targets['Rajwinder'].push(l);
        else if (text.includes('gurnam')) targets['Gurnam'].push(l);
        else if (text.includes('sandeep') || text.includes('sunny')) targets['Sandeep'].push(l);
        else if (text.includes('rajni')) targets['Rajni'].push(l);
    });

    console.log("📊 RECOVERY RESULTS:");
    for (const [name, list] of Object.entries(targets)) {
        console.log(`   👤 ${name}: Found ${list.length} leads in Unassigned Pool.`);

        if (list.length > 0) {
            const headers = ['Name', 'Phone', 'City', 'State', 'Source', 'Status', 'Date Filtered'];
            const rows = list.map(l => {
                const date = new Date(l.created_at).toLocaleDateString('en-IN');
                const cleanName = (l.name || '').replace(/,/g, ' ');
                const cleanCity = (l.city || '').replace(/,/g, ' ');
                return [cleanName, l.phone, cleanCity, l.state, l.source, l.status, date].join(',');
            });

            const csvContent = headers.join(',') + '\n' + rows.join('\n');
            const fileName = `${name}_Recovered_Leads.csv`;
            fs.writeFileSync(fileName, csvContent);
            console.log(`      💾 Saved: ${fileName}`);
        }
    }
}

recoverAndExport();
