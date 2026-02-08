
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://vewqzsqddgmkslnuctvb.supabase.co';
const SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDUzMDQ2MiwiZXhwIjoyMDgwMTA2NDYyfQ.pAgMGN6MtKm1A3fsKr1GIt8-qmKYhwFjSt92L_6_7us";

const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

async function searchRahul() {
    console.log("🔍 Searching for 'rahul.ahir2028@gmail.com' across ALL teams...\n");

    const { data: user, error } = await supabase.from('users')
        .select('id, name, email, team_code, is_active, daily_limit, leads_today, plan_name')
        .eq('email', 'rahul.ahir2028@gmail.com')
        .maybeSingle();

    if (error) return console.error(error);

    if (user) {
        console.log("✅ USER FOUND:");
        console.table([user]);
    } else {
        console.log("❌ USER NOT FOUND WITH THIS EXACT EMAIL.");

        // Let's search by name if email is slightly different
        const { data: similarUsers } = await supabase.from('users')
            .select('name, email, team_code, leads_today')
            .ilike('name', '%Rahul%Ahir%')
            .limit(5);

        if (similarUsers.length > 0) {
            console.log("\nSimilar Names Found:");
            console.table(similarUsers);
        }
    }

    console.log("\n📊 CURRENT PROGRESS: Users who received Chirag leads today:");
    const { data: activeLeads } = await supabase.from('users')
        .select('name, leads_today, daily_limit')
        .eq('team_code', 'GJ01TEAMFIRE')
        .gt('leads_today', 0)
        .order('leads_today', { ascending: false });

    console.table(activeLeads);
}

searchRahul();
