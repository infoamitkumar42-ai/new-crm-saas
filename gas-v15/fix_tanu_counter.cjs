
const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://vewqzsqddgmkslnuctvb.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDUzMDQ2MiwiZXhwIjoyMDgwMTA2NDYyfQ.pAgMGN6MtKm1A3fsKr1GIt8-qmKYhwFjSt92L_6_7us';
const supabase = createClient(supabaseUrl, supabaseKey);

async function fixTanuCounter() {
    console.log("🛠 Syncing Tanu's Counter to Actuals (4)...\n");

    const { data, error } = await supabase
        .from('users')
        .update({ leads_today: 4 })
        .eq('email', 'dhawantanu536@gmail.com')
        .select();

    if (error) { console.error(error); return; }

    console.log(`✅ Updated Count: ${data[0].leads_today}`);
}

fixTanuCounter();
