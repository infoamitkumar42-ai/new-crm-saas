const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const SUPABASE_URL = "https://vewqzsqddgmkslnuctvb.supabase.co";
const SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDUzMDQ2MiwiZXhwIjoyMDgwMTA2NDYyfQ.pAgMGN6MtKm1A3fsKr1GIt8-qmKYhwFjSt92L_6_7us";
const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

async function main() {
    console.log("📊 Debug: Checking TEAMRAJ user IDs and leads...\n");

    const { data: teamUsers } = await supabase.from('users')
        .select('id, name, team_code')
        .eq('team_code', 'TEAMRAJ');

    for (let u of teamUsers) {
        // Try assigned_to
        const { count: c1 } = await supabase.from('leads')
            .select('*', { count: 'exact', head: true }).eq('assigned_to', u.id);
        // Try user_id
        const { count: c2 } = await supabase.from('leads')
            .select('*', { count: 'exact', head: true }).eq('user_id', u.id);

        console.log(`${u.name} (${u.id}): assigned_to=${c1}, user_id=${c2}`);
    }

    // Also check by email matching
    const { data: rajLeads } = await supabase.from('leads')
        .select('id, assigned_to, user_id')
        .eq('assigned_to', teamUsers[0].id)
        .limit(3);
    console.log("\nSample leads for first user:", JSON.stringify(rajLeads));

    // Check if team uses a different user table
    const { data: sampleUser } = await supabase.from('users')
        .select('*').eq('team_code', 'TEAMRAJ').limit(1);
    console.log("\nSample user:", JSON.stringify(sampleUser?.[0]?.id));

    // Try matching leads by temp_assigned_email
    for (let u of teamUsers) {
        const { data: emailUser } = await supabase.from('users').select('email').eq('id', u.id).single();
        if (emailUser) {
            const { count } = await supabase.from('leads')
                .select('*', { count: 'exact', head: true }).eq('temp_assigned_email', emailUser.email);
            if (count > 0) console.log(`${u.name} via temp_assigned_email: ${count}`);
        }
    }
}

main().catch(console.error);
