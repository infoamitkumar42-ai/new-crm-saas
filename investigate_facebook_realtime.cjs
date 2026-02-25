const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = "https://vewqzsqddgmkslnuctvb.supabase.co";
const SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDUzMDQ2MiwiZXhwIjoyMDgwMTA2NDYyfQ.pAgMGN6MtKm1A3fsKr1GIt8-qmKYhwFjSt92L_6_7us";
const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

async function main() {
    const { data: leads } = await supabase.from('leads')
        .select('*')
        .is('assigned_to', null)
        .in('source', ['facebook', 'Realtime'])
        .order('created_at', { ascending: false });

    if (!leads || leads.length === 0) {
        console.log("No leads found for these sources.");
        return;
    }

    console.log(`Found ${leads.length} leads.\n`);

    const sourcesMap = { 'facebook': [], 'Realtime': [] };

    leads.forEach(l => {
        if (sourcesMap[l.source]) {
            sourcesMap[l.source].push(l);
        }
    });

    for (const src of ['facebook', 'Realtime']) {
        console.log(`=== SOURCE: ${src} (${sourcesMap[src].length} leads) ===`);

        let dateCount = {};
        let otherMeta = {};

        sourcesMap[src].forEach(l => {
            const date = l.created_at.split('T')[0];
            dateCount[date] = (dateCount[date] || 0) + 1;

            // Check for any distinguishing metadata
            const info = [];
            if (l.form_id) info.push(`Form: ${l.form_id}`);
            if (l.page_id) info.push(`Page: ${l.page_id}`);
            if (l.ad_id) info.push(`Ad: ${l.ad_id}`);
            if (l.miss_reason) info.push(`Reason: ${l.miss_reason}`);

            const metaStr = info.join(' | ') || 'No extra metadata';
            otherMeta[metaStr] = (otherMeta[metaStr] || 0) + 1;
        });

        console.log("Dates:");
        Object.entries(dateCount).forEach(([d, c]) => console.log(`  - ${d}: ${c} leads`));

        console.log("Metadata Profiles (Fields available):");
        Object.entries(otherMeta).forEach(([m, c]) => console.log(`  - [${c} leads] -> ${m}`));

        // Show a sample row for context
        if (sourcesMap[src].length > 0) {
            console.log("Sample Data Entry:");
            const sample = sourcesMap[src][0];
            console.log(`  Name: ${sample.name}`);
            console.log(`  Phone: ${sample.phone}`);
            console.log(`  City: ${sample.city}`);
            console.log(`  Notes: ${sample.notes ? sample.notes.substring(0, 50) : null}`);
        }
        console.log("\n");
    }
}

main().catch(console.error);
