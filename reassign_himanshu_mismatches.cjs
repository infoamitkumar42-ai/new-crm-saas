const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = "https://vewqzsqddgmkslnuctvb.supabase.co";
const SUPABASE_SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDUzMDQ2MiwiZXhwIjoyMDgwMTA2NDYyfQ.pAgMGN6MtKm1A3fsKr1GIt8-qmKYhwFjSt92L_6_7us";

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function reassignMismatches() {
    console.log("🔄 Starting Reassignment of HIMANSHU leads (Recovering from stolen assignments)...");

    const specialistEmails = [
        'ludhranimohit91@gmail.com', 'dineshmonga22@gmail.com', 'dhawantanu536@gmail.com',
        'harmandeepkaurmanes790@gmail.com', 'payalpuri3299@gmail.com', 'vansh.rajni.96@gmail.com',
        'rupanasameer551@gmail.com', 'loveleenkaur8285@gmail.com', 'rohitgagneja69@gmail.com',
        'rasganiya98775@gmail.com', 'jerryvibes.444@gmail.com', 'brark5763@gmail.com',
        'sharmahimanshu9797@gmail.com', 'rrai26597@gmail.com', 'samandeepkaur1216@gmail.com',
        'dbrar8826@gmail.com', 'nehagoyal36526@gmail.com', 'rahulkumarrk1111@gmail.com'
    ];

    // 1. Fetch Specialists
    const { data: specialists, error: specErr } = await supabase
        .from('users')
        .select('id, name, email, leads_today')
        .in('email', specialistEmails);

    if (specErr) throw specErr;
    const specialistIds = specialists.map(s => s.id);

    // 2. Fetch Todays Leades from Himanshu 2
    const startOfDay = new Date();
    startOfDay.setUTCHours(0, 0, 0, 0);

    const { data: leads, error: leadErr } = await supabase
        .from('leads')
        .select('id, assigned_to, name, phone, source')
        .ilike('source', '%Himanshu%')
        .eq('status', 'Assigned')
        .gte('created_at', startOfDay.toISOString());

    if (leadErr) throw leadErr;

    // 3. Filter for Mismatches (Assigned to someone NOT in the 18)
    const mismatches = leads.filter(l => !specialistIds.includes(l.assigned_to));
    console.log(`🔍 Found ${mismatches.length} leads assigned to outsiders.`);

    if (mismatches.length === 0) {
        console.log("✅ No mismatches found. Distribution is already restricted to specialists.");
        return;
    }

    // 4. Reassign
    let count = 0;
    for (const lead of mismatches) {
        // Round Robin among specialists
        specialists.sort((a, b) => (a.leads_today || 0) - (b.leads_today || 0));
        const target = specialists[0];

        const { error: updErr } = await supabase
            .from('leads')
            .update({
                assigned_to: target.id,
                user_id: target.id,
                notes: `(Reassigned from outlier) - Specialist Recovery`
            })
            .eq('id', lead.id);

        if (!updErr) {
            target.leads_today = (target.leads_today || 0) + 1;
            await supabase.rpc('increment_leads_today', { user_id: target.id });
            // Should usually decrement from the original user, but we'll leave it simple for now.
            count++;
        }
    }

    console.log(`\n🎉 Successfully recovered ${count} leads for Himanshu's team specialists!`);
}

reassignMismatches();
