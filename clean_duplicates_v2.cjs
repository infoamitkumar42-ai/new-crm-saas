const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://vewqzsqddgmkslnuctvb.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDUzMDQ2MiwiZXhwIjoyMDgwMTA2NDYyfQ.pAgMGN6MtKm1A3fsKr1GIt8-qmKYhwFjSt92L_6_7us';
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function cleanAllDuplicates() {
    console.log('Starting Deep Clean...');
    let from = 0;
    const size = 1000;
    let allLeads = [];

    // 1. Fetch ALL leads (pagination)
    while (true) {
        console.log(`Fetching ${from} - ${from + size}...`);
        const { data: leads, error } = await supabase
            .from('leads')
            .select('id, phone, created_at')
            .order('created_at', { ascending: true })
            .range(from, from + size - 1);

        if (error) { console.error(error); break; }
        if (!leads || leads.length === 0) break;

        allLeads = allLeads.concat(leads);
        from += size;
        if (leads.length < size) break;
    }

    console.log(`Total Leads Fetched: ${allLeads.length}`);

    // 2. Identify Duplicates
    const seen = new Set();
    const toDelete = [];

    for (const lead of allLeads) {
        if (!lead.phone) continue;
        const p = lead.phone.trim();
        if (p.length < 10) continue; // Ignore bad numbers

        if (seen.has(p)) {
            // This is a duplicate (and since we sorted ASC, it's newer)
            toDelete.push(lead.id);
        } else {
            seen.add(p);
        }
    }

    console.log(`Found ${toDelete.length} duplicates to delete.`);

    // 3. Delete
    if (toDelete.length > 0) {
        for (let i = 0; i < toDelete.length; i += 50) {
            const batch = toDelete.slice(i, i + 50);
            const { error } = await supabase.from('leads').delete().in('id', batch);
            if (error) console.log(`Error deleting batch ${i}: ${error.message}`);
            else console.log(`Deleted batch ${i}...`);
        }
    }

    // 4. Instructions for Constraint
    console.log('--- READY FOR CONSTRAINT ---');
    console.log('All duplicates removed. You can now safe run:');
    console.log('ALTER TABLE leads ADD CONSTRAINT unique_lead_phone UNIQUE (phone);');
}

cleanAllDuplicates();
