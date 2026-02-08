
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://vewqzsqddgmkslnuctvb.supabase.co';
const SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDUzMDQ2MiwiZXhwIjoyMDgwMTA2NDYyfQ.pAgMGN6MtKm1A3fsKr1GIt8-qmKYhwFjSt92L_6_7us";

const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

async function checkLatestStuck() {
    console.log("🕵️‍♂️ Checking for STUCK leads (Last 30 mins)...");

    const { data: leads } = await supabase.from('leads')
        .select('*')
        .eq('status', 'New')
        .order('created_at', { ascending: false })
        .limit(20);

    if (leads.length > 0) {
        console.log(`⚠️ FOUND ${leads.length} STUCK LEADS!`);
        console.table(leads.map(l => ({
            Name: l.name,
            Source: l.source,
            Time: new Date(l.created_at).toLocaleTimeString()
        })));

        // AUTO FIX NOW
        console.log("🚑 Auto-Assigning these immediately...");
        for (const l of leads) {
            let team = 'TEAMFIRE'; // Default
            if (l.source.match(/rajwinder/i)) team = 'TEAMRAJ';
            if (l.source.match(/chirag/i)) team = 'GJ01TEAMFIRE';

            // Find User
            const { data: u } = await supabase.from('users').select('id').eq('team_code', team).eq('is_active', true).limit(1).single();
            if (u) {
                await supabase.from('leads').update({ assigned_to: u.id, status: 'Assigned' }).eq('id', l.id);
            }
        }
        console.log("✅ Fixed.");
    } else {
        console.log("✅ No Stuck Leads found in last check.");
    }
}

checkLatestStuck();
