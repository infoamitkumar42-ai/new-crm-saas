
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://vewqzsqddgmkslnuctvb.supabase.co';
const SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDUzMDQ2MiwiZXhwIjoyMDgwMTA2NDYyfQ.pAgMGN6MtKm1A3fsKr1GIt8-qmKYhwFjSt92L_6_7us";

const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

async function inspect() {
    console.log('🔍 Inspecting CONNECTED_PAGES table columns...');

    // Just fetch one row
    const { data, error } = await supabase.from('connected_pages').select('*').limit(1);

    if (error) {
        console.error(error);
        return;
    }

    if (data && data.length > 0) {
        console.log('Columns found:', Object.keys(data[0]));
        if (data[0].team_code !== undefined) {
            console.log('✅ team_code column EXISTS.');
        } else {
            console.log('❌ team_code column MISSING. (Must fetch via Manager)');
        }
    } else {
        console.log('Table empty.');
    }
}

inspect();
