
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://vewqzsqddgmkslnuctvb.supabase.co';
const SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDUzMDQ2MiwiZXhwIjoyMDgwMTA2NDYyfQ.pAgMGN6MtKm1A3fsKr1GIt8-qmKYhwFjSt92L_6_7us";

const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

async function checkWide() {
    console.log("🕵️‍♂️ Checking ALL assigned 'facebook' leads...");

    const { data: leads } = await supabase.from('leads')
        .select('id, assigned_to, source')
        .or('source.eq.facebook,source.eq.Facebook Orphan Rescue')
        .eq('status', 'Assigned');

    console.log(`Found: ${leads.length}`);

    if (leads.length > 0) {
        // Check Plans
        const userIds = [...new Set(leads.map(l => l.assigned_to))];
        const { data: users } = await supabase
            .from('users')
            .select('id, name, valid_until, plan_name')
            .in('id', userIds);

        const bad = users.filter(u => !u.valid_until || new Date(u.valid_until) < new Date());

        if (bad.length > 0) {
            console.error(`❌ FOUND ${bad.length} EXPIRED USERS WITH LEADS!`);
            console.table(bad);
        } else {
            console.log("✅ All Users Valid.");
        }
    }
}

checkWide();
