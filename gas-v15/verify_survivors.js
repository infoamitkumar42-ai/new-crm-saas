import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://vewqzsqddgmkslnuctvb.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDUzMDQ2MiwiZXhwIjoyMDgwMTA2NDYyfQ.pAgMGN6MtKm1A3fsKr1GIt8-qmKYhwFjSt92L_6_7us';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function verifySurvivorDates() {
    console.log('\n🔍 --- VERIFYING SURVIVOR ASSIGNMENT DATES ---\n');

    const { data: survivors } = await supabase
        .from('leads')
        .select('created_at, assigned_at')
        .not('assigned_to', 'is', null)
        .lt('created_at', new Date(new Date().setHours(0, 0, 0, 0)).toISOString())
        .limit(20);

    if (survivors && survivors.length > 0) {
        console.log('Sample Old Survivors:\n');
        survivors.forEach(l => {
            console.log(`Created: ${l.created_at} | Assigned: ${l.assigned_at}`);
        });

        // Check if assigned_at is TODAY
        const today = new Date().toISOString().split('T')[0];
        const fakeSurvivors = survivors.filter(l => l.assigned_at && l.assigned_at.startsWith(today));

        console.log(`\nResults:`);
        console.log(`Total sample: ${survivors.length}`);
        console.log(`Assigned TODAY (Fake): ${fakeSurvivors.length}`);
        console.log(`Assigned IN PAST (Real): ${survivors.length - fakeSurvivors.length}`);

        if (fakeSurvivors.length === survivors.length) {
            console.log('\n❌ BAD NEWS: All "survivors" were assigned TODAY. They are not original.');
        } else if (fakeSurvivors.length === 0) {
            console.log('\n✅ GOOD NEWS: All survivors have original dates!');
        } else {
            console.log('\n⚠️ MIXED: Some real, some fake.');
        }
    } else {
        console.log('No old survivors found.');
    }
}

verifySurvivorDates();
