import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://vewqzsqddgmkslnuctvb.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDUzMDQ2MiwiZXhwIjoyMDgwMTA2NDYyfQ.pAgMGN6MtKm1A3fsKr1GIt8-qmKYhwFjSt92L_6_7us';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function checkAssignedTo() {
    console.log('\n🔍 --- CHECKING assigned_to FIELD ---\n');

    // Check how many leads have assigned_to populated
    const { count: withAssignedTo } = await supabase
        .from('leads')
        .select('*', { count: 'exact', head: true })
        .not('assigned_to', 'is', null);

    const { count: total } = await supabase
        .from('leads')
        .select('*', { count: 'exact', head: true });

    console.log(`Total leads: ${total}`);
    console.log(`Leads with assigned_to: ${withAssignedTo}`);
    console.log(`Leads without assigned_to: ${total - withAssignedTo}\n`);

    if (withAssignedTo > 0) {
        console.log('🎯 GREAT NEWS! assigned_to field has data!\n');

        // Sample data
        const { data: samples } = await supabase
            .from('leads')
            .select('id, name, phone, user_id, assigned_to, created_at')
            .not('assigned_to', 'is', null)
            .limit(10);

        console.log('Sample leads with assigned_to:\n');
        console.table(samples);

        console.log('\n✅ WE CAN RESTORE FROM assigned_to FIELD!\n');
    } else {
        console.log('❌ assigned_to field is also empty\n');
    }
}

checkAssignedTo();
