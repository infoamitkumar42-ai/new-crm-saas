const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = "https://vewqzsqddgmkslnuctvb.supabase.co";
const SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDUzMDQ2MiwiZXhwIjoyMDgwMTA2NDYyfQ.pAgMGN6MtKm1A3fsKr1GIt8-qmKYhwFjSt92L_6_7us";
const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

async function main() {
    console.log("🔍 Checking Lead History since Feb 1st for Inactive TEAMFIRE Users...\n");

    const emails = ['nikkibaljinderkaur@gmail.com', 'ranimani073@gmail.com'];
    const feb1st = new Date('2026-02-01T00:00:00.000Z');

    const { data: users, error: uErr } = await supabase
        .from('users')
        .select('id, name, email')
        .in('email', emails);

    if (uErr) {
        console.error("Error fetching users:", uErr.message);
        return;
    }

    for (let user of users) {
        const { data: leads, error: lErr } = await supabase
            .from('leads')
            .select('id, created_at, assigned_at')
            .eq('assigned_to', user.id);

        if (lErr) {
            console.error(`Error fetching leads for ${user.name}:`, lErr.message);
            continue;
        }

        const totalLeads = leads.length;
        const leadsSinceFeb1 = leads.filter(l => {
            const d = l.assigned_at ? new Date(l.assigned_at) : new Date(l.created_at);
            return d >= feb1st;
        });

        console.log(`- ${user.name} (${user.email}):`);
        console.log(`  > Total Leads (Lifetime): ${totalLeads}`);
        console.log(`  > Leads Assigned SINCE 1st Feb: ${leadsSinceFeb1.length}\n`);
    }
}

main().catch(console.error);
