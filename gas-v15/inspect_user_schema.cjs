
const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://vewqzsqddgmkslnuctvb.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDUzMDQ2MiwiZXhwIjoyMDgwMTA2NDYyfQ.pAgMGN6MtKm1A3fsKr1GIt8-qmKYhwFjSt92L_6_7us';
const supabase = createClient(supabaseUrl, supabaseKey);

async function inspect() {
    console.log("🔍 Inspecting User Schema...");
    const { data: users, error } = await supabase.from('users').select('*').limit(1);
    if (error) { console.error(error); return; }
    if (users.length > 0) {
        console.log("User Keys:", Object.keys(users[0]));
        console.log("Sample Data:", JSON.stringify(users[0], null, 2));
    }
}
inspect();
