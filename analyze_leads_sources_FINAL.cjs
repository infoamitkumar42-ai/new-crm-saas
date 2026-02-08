
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://vewqzsqddgmkslnuctvb.supabase.co';
const SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDUzMDQ2MiwiZXhwIjoyMDgwMTA2NDYyfQ.pAgMGN6MtKm1A3fsKr1GIt8-qmKYhwFjSt92L_6_7us";

const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

const TEAM_CODE = 'GJ01TEAMFIRE';

async function analyzeSources() {
    console.log("📊 ANALYZING SOURCES OF THE 716 LEADS...");

    // Get Active Members
    const { data: team } = await supabase.from('users').select('id').eq('team_code', TEAM_CODE).eq('is_active', true);
    const teamIds = team.map(u => u.id);

    // Get Leads assigned to them (Feb 5 - Feb 6)
    const { data: leads, error } = await supabase
        .from('leads')
        .select('source')
        .in('assigned_to', teamIds)
        .gte('created_at', '2026-02-05T00:00:00+05:30');

    if (error) { console.error(error); return; }

    const counts = {};
    leads.forEach(l => {
        const src = l.source || 'Unknown';
        counts[src] = (counts[src] || 0) + 1;
    });

    console.log(`✅ Total Analyzed: ${leads.length}`);
    console.log("-----------------------------------");
    for (const [src, count] of Object.entries(counts)) {
        console.log(`${src.padEnd(40)} | ${count}`);
    }
}

analyzeSources();
