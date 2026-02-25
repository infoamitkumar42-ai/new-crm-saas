const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = "https://vewqzsqddgmkslnuctvb.supabase.co";
const SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDUzMDQ2MiwiZXhwIjoyMDgwMTA2NDYyfQ.pAgMGN6MtKm1A3fsKr1GIt8-qmKYhwFjSt92L_6_7us";
const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

async function main() {
    console.log("🔍 Checking user exact record for cmdarji1997@gmail.com...");

    const email = 'cmdarji1997@gmail.com';

    const { data: user, error } = await supabase
        .from('users')
        .select('*')
        .eq('email', email)
        .single();

    if (error) {
        console.error("Error fetching user:", error.message);
        return;
    }

    if (!user) {
        console.log("User not found in the database with that email.");
    } else {
        console.log(`\nUser Details:`);
        console.log(`- ID: ${user.id}`);
        console.log(`- Name: ${user.name}`);
        console.log(`- Team Code: ${user.team_code}`);
        console.log(`- Plan Name: ${user.plan_name}`);

        // Highlight the important part
        if (user.is_active === true) {
            console.log(`- Is Active: TRUE ✅ (System thinks they are active!)`);
        } else {
            console.log(`- Is Active: FALSE ❌ (They are currently inactive in DB)`);
        }

        console.log(`- Leads Today: ${user.leads_today}`);
        console.log(`- Account Created: ${user.created_at}`);

        // Fetch their latest leads
        const { data: leads } = await supabase
            .from('leads')
            .select('id, name, created_at, assigned_at')
            .eq('assigned_to', user.id)
            .order('assigned_at', { ascending: false })
            .limit(5);

        console.log(`\nLatest Leads Assigned to them:`);
        if (leads && leads.length > 0) {
            leads.forEach(l => {
                console.log(`  > ${l.name} | Assigned at: ${l.assigned_at}`);
            });
        } else {
            console.log("  None found.");
        }
    }
}

main().catch(console.error);
