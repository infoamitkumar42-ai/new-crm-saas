import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://vewqzsqddgmkslnuctvb.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDUzMDQ2MiwiZXhwIjoyMDgwMTA2NDYyfQ.pAgMGN6MtKm1A3fsKr1GIt8-qmKYhwFjSt92L_6_7us';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function verifyOrigins() {
    console.log('\n🕵️ --- VERIFYING ASSIGNED LEAD ORIGINS ---\n');

    // Check leads assigned to Swati and Simrans recently
    // We know the IDs from previous step
    const targetIds = [
        '0e3b5d84-cf0d-4cc3-9237-3e6e42cbdfdd', // Swati
        '3374d851-2b81-492c-8619-13a26e6360db', // Simran K
        '5cca04ae-3d29-4efe-a12a-0b01336cddee'  // Simran S
    ];

    const { data: leads } = await supabase
        .from('leads')
        .select('name, phone, created_at, source')
        .in('assigned_to', targetIds)
        .order('assigned_at', { ascending: false })
        .limit(15);

    if (leads) {
        leads.forEach(l => {
            const d = new Date(l.created_at);
            console.log(`- ${l.name}: Created at ${l.created_at} (${l.source || 'Unknown Source'})`);
            // Check if today
            const isToday = new Date().toDateString() === d.toDateString();
            console.log(`  --> Is Today? ${isToday ? 'YES' : 'NO'}`);
        });
    }
}

verifyOrigins();
