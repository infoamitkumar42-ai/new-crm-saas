const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://vewqzsqddgmkslnuctvb.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDUzMDQ2MiwiZXhwIjoyMDgwMTA2NDYyfQ.pAgMGN6MtKm1A3fsKr1GIt8-qmKYhwFjSt92L_6_7us';
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function cleanDuplicates() {
    console.log('Fetching all phone numbers...');

    // Fetch all leads (id, phone, created_at)
    // Supabase limit is 1000, we might need loops or "smart" rpc. 
    // For now, let's fetch last 5000 leads (where most dupes likely are).

    const { data: leads, error } = await supabase
        .from('leads')
        .select('id, phone, created_at')
        .order('created_at', { ascending: false })
        .limit(3000);

    if (error) { console.error(error); return; }

    const phoneMap = new Map();
    const toDelete = [];

    console.log(`Analyzing ${leads.length} leads...`);

    for (const lead of leads) {
        if (!lead.phone || lead.phone.length < 10) continue;

        if (phoneMap.has(lead.phone)) {
            // Duplicate found!
            // We kept the "later" one first because of desc sort? 
            // Wait, logic:
            // "order desc" -> we see NEWEST first. 
            // If we find it in map, it means we already saw a NEWER one.
            // Usually we want to keep the OLDEST (Original). 
            // So if we iterate DESC, the last one we see is the OLDEST.
            // So we should mark the CURRENT one (Newer) as "to keep" IF map is empty?
            // No, let's sort ASCENDING (Oldest first).
        }
    }
}

// Better Logic: Fetch Sorted ASC. Map stores first ID. Subsequent matches are duplicates to delete.
async function cleanDuplicatesAsc() {
    console.log('Fetching leads (Oldest First)...');

    const { data: leads } = await supabase
        .from('leads')
        .select('id, phone, created_at')
        .not('phone', 'is', null) // Filter nulls
        // .gt('created_at', '2026-01-01') // Optimization: Only check this year?
        .order('created_at', { ascending: true }); // Oldest first
    // Note: this might hit 1000 limit. 

    if (!leads) return;
    console.log(`Loaded ${leads.length} leads.`);

    const seen = new Set();
    const toDelete = [];

    for (const lead of leads) {
        const p = lead.phone.trim();
        if (p.length < 10) continue; // Ignore tiny invalid

        if (seen.has(p)) {
            toDelete.push(lead.id);
        } else {
            seen.add(p);
        }
    }

    console.log(`Found ${toDelete.length} duplicates to delete.`);

    if (toDelete.length > 0) {
        // Delete in batches
        for (let i = 0; i < toDelete.length; i += 100) {
            const batch = toDelete.slice(i, i + 100);
            const { error } = await supabase.from('leads').delete().in('id', batch);
            if (error) console.error('Delete error', error);
            else console.log(`Deleted leads ${i} to ${i + batch.length}`);
        }
    }
}

cleanDuplicatesAsc();
