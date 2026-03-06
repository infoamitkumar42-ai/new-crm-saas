const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://vewqzsqddgmkslnuctvb.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDUzMDQ2MiwiZXhwIjoyMDgwMTA2NDYyfQ.pAgMGN6MtKm1A3fsKr1GIt8-qmKYhwFjSt92L_6_7us";

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function check() {
    const { data: payments, error: pError } = await supabase.from('payments').select('*').limit(5);
    console.log('Payments Table Error:', pError);
    console.log('Payments Table sample:', payments);

    const { data: leads, error: lError } = await supabase.from('leads').select('source').limit(50);
    console.log('Leads Error:', lError);
    const sources = [...new Set((leads || []).map(l => l.source))];
    console.log('Lead Sources sample:', sources);
}

check();
