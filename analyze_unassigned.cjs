
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://vewqzsqddgmkslnuctvb.supabase.co';
const SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDUzMDQ2MiwiZXhwIjoyMDgwMTA2NDYyfQ.pAgMGN6MtKm1A3fsKr1GIt8-qmKYhwFjSt92L_6_7us";

const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

async function analyzeUnassigned() {
    console.log("🕵️‍♂️ ANALYZING 954 UNASSIGNED LEADS FOR HIDDEN OWNERS...\n");

    const { data: leads } = await supabase.from('leads')
        .select('name, source, notes, created_at')
        .or('assigned_to.is.null,assigned_to.eq.UNASSIGNED')
        .gte('created_at', '2026-01-01T00:00:00');

    if (!leads) return console.log("No unassigned leads found.");

    // Counter for names
    const owners = {
        'Rajwinder': 0,
        'Gurnam': 0,
        'Sandeep': 0,
        'Rajni': 0,
        'Unknown': 0
    };

    leads.forEach(l => {
        const text = ((l.source || '') + ' ' + (l.notes || '') + ' ' + (l.name || '')).toLowerCase();

        if (text.includes('rajwinder')) owners['Rajwinder']++;
        else if (text.includes('gurnam')) owners['Gurnam']++;
        else if (text.includes('sandeep') || text.includes('sunny')) owners['Sandeep']++;
        else if (text.includes('rajni')) owners['Rajni']++;
        else owners['Unknown']++;
    });

    console.log("📊 FOUND HIDDEN LEADS (In Unassigned Pile):");
    console.table(owners);

    console.log("\n📦 SAMPLE UNASSIGNED LEADS (To identify pattern):");
    console.table(leads.slice(0, 5).map(l => ({
        Created: new Date(l.created_at).toLocaleDateString(),
        Source: l.source,
        Notes: l.notes
    })));
}

analyzeUnassigned();
