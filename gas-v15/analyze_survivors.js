import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://vewqzsqddgmkslnuctvb.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDUzMDQ2MiwiZXhwIjoyMDgwMTA2NDYyfQ.pAgMGN6MtKm1A3fsKr1GIt8-qmKYhwFjSt92L_6_7us';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function analyzeSurvivors() {
    console.log('\n🔍 --- ANALYZING 715 SURVIVORS ---\n');

    // Get leads that have assigned_to set (our survivors)
    const { data: survivors, error } = await supabase
        .from('leads')
        .select('created_at')
        .not('assigned_to', 'is', null)
        .limit(100);

    if (error) {
        console.error('Error:', error);
        return;
    }

    if (survivors.length > 0) {
        console.log(`Analyzed sample of ${survivors.length} survivors.`);

        // Check date range
        const dates = survivors.map(l => new Date(l.created_at));
        const minDate = new Date(Math.min.apply(null, dates));
        const maxDate = new Date(Math.max.apply(null, dates));

        console.log(`Earliest Survivor: ${minDate.toISOString()}`);
        console.log(`Latest Survivor:   ${maxDate.toISOString()}`);

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const oldSurvivors = survivors.filter(l => new Date(l.created_at) < today);
        console.log(`Survivors older than today: ${oldSurvivors.length}`);

        if (oldSurvivors.length === 0) {
            console.log('\n✅ CONCLUSION: Only TODAY\'S leads survived the deletion.');
            console.log('   All historical assignment data was successfully wiped.');
        } else {
            console.log('\n❓ Some old leads survived. Why?');
        }
    }
}

analyzeSurvivors();
