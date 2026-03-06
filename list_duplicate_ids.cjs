const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://vewqzsqddgmkslnuctvb.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDUzMDQ2MiwiZXhwIjoyMDgwMTA2NDYyfQ.pAgMGN6MtKm1A3fsKr1GIt8-qmKYhwFjSt92L_6_7us";

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

const GURPREET_ID = '3a55235b-29cb-4438-b06c-ec4e8839f0df';

async function identifyDuplicates() {
    console.log('--- Identifying Duplicate Assignments ---');

    // Get all leads assigned to Gurpreet today
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();

    const { data: leads } = await supabase
        .from('leads')
        .select('id, name, phone, created_at, assigned_at')
        .eq('assigned_to', GURPREET_ID)
        .gte('assigned_at', todayStart);

    if (!leads) {
        console.log('No leads assigned today.');
        return;
    }

    console.log(`Checking ${leads.length} leads assigned today...`);

    const duplicates = [];
    const yesterdayStart = new Date('2026-02-25T18:30:00Z');
    const yesterdayEnd = new Date('2026-02-26T18:30:00Z');

    for (const lead of leads) {
        const createdAt = new Date(lead.created_at);
        // If it was created/assigned yesterday (Feb 26), it was part of the "distribution" the user worried about
        if (createdAt >= yesterdayStart && createdAt < yesterdayEnd) {
            duplicates.push(lead);
        }
    }

    console.log(`Found ${duplicates.length} duplicate leads (from yesterday's batch).`);
    duplicates.forEach(d => console.log(`- ${d.name} (${d.phone}) | Created: ${d.created_at}`));
}

identifyDuplicates();
