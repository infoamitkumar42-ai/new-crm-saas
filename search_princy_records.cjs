const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = "https://vewqzsqddgmkslnuctvb.supabase.co";
const SUPABASE_SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDUzMDQ2MiwiZXhwIjoyMDgwMTA2NDYyfQ.pAgMGN6MtKm1A3fsKr1GIt8-qmKYhwFjSt92L_6_7us";

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function searchPrincy() {
    console.log(`🔍 Searching for "Princy" in all records...`);

    // 1. Search users by name
    const { data: users } = await supabase.from('users').select('*').ilike('name', '%Princy%');
    console.log(`\nUsers found with name "Princy": ${users?.length || 0}`);
    users?.forEach(u => console.log(`- ${u.name} | ${u.email} | ID: ${u.id}`));

    // 2. Search payments by email pattern or name
    const { data: payments } = await supabase.from('payments').select('*').ilike('email', '%princy%');
    console.log(`\nPayments found with "princy" in email: ${payments?.length || 0}`);
    payments?.forEach(p => console.log(`- ${p.email} | ${new Date(p.created_at).toLocaleDateString()} | ${p.amount} | Status: ${p.status}`));
}

searchPrincy();
