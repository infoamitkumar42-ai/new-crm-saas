
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://vewqzsqddgmkslnuctvb.supabase.co';
const SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDUzMDQ2MiwiZXhwIjoyMDgwMTA2NDYyfQ.pAgMGN6MtKm1A3fsKr1GIt8-qmKYhwFjSt92L_6_7us";

const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

async function verifyAssignees() {
    console.log("🕵️‍♂️ Audit: Checking if leads went to Unpaid/Expired Users...");

    const startOfDay = new Date(); startOfDay.setHours(0, 0, 0, 0);
    const now = new Date();

    // 1. Get Leads assigned via our Rescue Script today
    const { data: leads } = await supabase.from('leads')
        .select('id, assigned_to, name')
        .eq('source', 'Facebook Orphan Rescue')
        .gte('created_at', startOfDay.toISOString());

    if (!leads || leads.length === 0) {
        console.log("No Rescue leads found.");
        return;
    }

    // 2. Get Unique User IDs
    const userIds = [...new Set(leads.map(l => l.assigned_to).filter(Boolean))];

    // 3. Check Payment Status of these users
    const { data: users } = await supabase.from('users')
        .select('id, name, valid_until, plan_name, is_active')
        .in('id', userIds);

    const badUsers = [];

    users.forEach(u => {
        const expiry = new Date(u.valid_until);
        const isActivePlan = u.valid_until && expiry > now;

        if (!isActivePlan) {
            badUsers.push({
                id: u.id,
                name: u.name,
                plan: u.plan_name,
                valid_until: u.valid_until
            });
        }
    });

    if (badUsers.length > 0) {
        console.error(`⚠️ ALARM: ${badUsers.length} Users received leads but have EXPIRED PLANS!`);
        console.table(badUsers);

        // AUTO-REVERT LOGIC?
        // Let's identify the leads given to them
        console.log("\n🔄 Recommend: Re-distribute these leads immediately.");
    } else {
        console.log("✅ ALL GREEN: All assignees have Active/Valid Plans.");
    }
}

verifyAssignees();
