import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://vewqzsqddgmkslnuctvb.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDUzMDQ2MiwiZXhwIjoyMDgwMTA2NDYyfQ.pAgMGN6MtKm1A3fsKr1GIt8-qmKYhwFjSt92L_6_7us';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function inspectGapLeads() {
    console.log('\n🔎 --- INSPECTING JAN 16 PM GAP LEADS ---');

    const startCheck = new Date('2026-01-16T16:00:00+05:30').toISOString();
    const endCheck = new Date('2026-01-17T04:00:00+05:30').toISOString();

    const { data: leads, error } = await supabase
        .from('leads')
        .select('*')
        .gte('created_at', startCheck)
        .lte('created_at', endCheck);

    if (error) {
        console.error("Error:", error.message);
        return;
    }

    console.log(`Found ${leads.length} leads in the Gap Window.`);

    if (leads.length === 0) return;

    console.log("\nSample Data (First 5):");
    leads.slice(0, 5).forEach(l => {
        console.log(`- [${l.id}] ${l.name} (${l.phone})`);
        console.log(`  Status: ${l.status}, Assigned: ${l.assigned_to}`);
        console.log(`  Source: ${l.source}`);
        console.log(`  Created: ${l.created_at}`);
        console.log(`  Notes: ${JSON.stringify(l.notes)}`); // Check for hidden info
        console.log('---');
    });

    const unassignedCount = leads.filter(l => !l.assigned_to).length;
    console.log(`\nUnassigned Count: ${unassignedCount} / ${leads.length}`);
}

inspectGapLeads();
