
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://vewqzsqddgmkslnuctvb.supabase.co';
const SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDUzMDQ2MiwiZXhwIjoyMDgwMTA2NDYyfQ.pAgMGN6MtKm1A3fsKr1GIt8-qmKYhwFjSt92L_6_7us";

const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

async function getData() {
    // 1. Get Ajay's ID
    const { data: user } = await supabase.from('users').select('id, name').eq('name', 'AJAY AHIR').single();

    // 2. Get a Lead assigned to him
    const { data: lead } = await supabase.from('leads').select('id, phone').eq('assigned_to', user.id).limit(1).single();

    console.log(`-- TEST PARAMS`);
    console.log(`-- User ID: '${user.id}'`);
    console.log(`-- Lead ID: '${lead.id}'`);
}

getData();
