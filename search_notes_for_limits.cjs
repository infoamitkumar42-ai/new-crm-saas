const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://vewqzsqddgmkslnuctvb.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDUzMDQ2MiwiZXhwIjoyMDgwMTA2NDYyfQ.pAgMGN6MtKm1A3fsKr1GIt8-qmKYhwFjSt92L_6_7us";

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function searchNotes() {
    const yesterdayStart = '2026-02-25T18:30:00Z';
    const yesterdayEnd = '2026-02-26T18:30:00Z';

    console.log('--- Searching for limit keywords in yesterday\'s leads ---');
    const { data: leads } = await supabase
        .from('leads')
        .select('name, phone, notes, assigned_to')
        .gte('created_at', yesterdayStart)
        .lt('created_at', yesterdayEnd)
        .or('notes.ilike.%limit%,notes.ilike.%reach%,notes.ilike.%overflow%,notes.ilike.%max%');

    if (leads && leads.length > 0) {
        console.log(`Found ${leads.length} leads with limit-related notes.`);
        leads.slice(0, 5).forEach(l => console.log(`${l.name} | Note: ${l.notes} | Assigned To: ${l.assigned_to}`));
    } else {
        console.log('No matching leads found in notes.');
    }
}
searchNotes();
