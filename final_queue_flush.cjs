
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://vewqzsqddgmkslnuctvb.supabase.co';
const SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDUzMDQ2MiwiZXhwIjoyMDgwMTA2NDYyfQ.pAgMGN6MtKm1A3fsKr1GIt8-qmKYhwFjSt92L_6_7us";

const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

async function flushQueue() {
    console.log("🚽 Flushing Queue (Applying Safety Net to Old Stuck Leads)...");

    // 1. Get Stuck Leads
    const { data: leads } = await supabase
        .from('leads')
        .select('id, source, name')
        .or('status.eq.New,status.eq.Orphan')
        .gte('created_at', new Date().toISOString().split('T')[0]); // Only Today's

    if (!leads || leads.length === 0) {
        console.log("✅ Queue is Empty.");
        return;
    }

    console.log(`Found ${leads.length} stuck leads. Updating to trigger assignment...`);

    // 2. Dummy Update to trigger 'Safety Net'? 
    // Wait, the trigger is BEFORE INSERT. It won't work on UPDATE.
    // We have to Manually Assign them using the same logic.

    for (const l of leads) {
        let team = '';
        if (l.source.match(/chirag|bhumit|manual/i)) team = 'GJ01TEAMFIRE';
        else if (l.source.match(/rajwinder|raj/i)) team = 'TEAMRAJ';
        else if (l.source.match(/cbo|himanshu|fire/i)) team = 'TEAMFIRE';
        else continue; // Unknown

        // Find User
        const { data: user } = await supabase.from('users')
            .select('id, name, leads_today')
            .eq('team_code', team)
            .eq('is_active', true)
            .lt('leads_today', 50) // Safe Limit
            .order('leads_today')
            .limit(1)
            .single();

        if (user) {
            await supabase.from('leads').update({
                assigned_to: user.id,
                status: 'Assigned'
            }).eq('id', l.id);

            await supabase.from('users').update({ leads_today: user.leads_today + 1 }).eq('id', user.id);
            console.log(`✅ Fixed: ${l.name} -> ${user.name}`);
        }
    }
    console.log("🎉 Cleaned.");
}

flushQueue();
