import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://vewqzsqddgmkslnuctvb.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDUzMDQ2MiwiZXhwIjoyMDgwMTA2NDYyfQ.pAgMGN6MtKm1A3fsKr1GIt8-qmKYhwFjSt92L_6_7us';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function checkTeamAssignments() {
    const email = 'samandeepkaur1216@gmail.com';
    const { data: user } = await supabase.from('users').select('id, name, team_code, manager_id').eq('email', email).single();
    if (!user) return;

    console.log(`User: ${user.name}, Team: ${user.team_code}, Manager ID: ${user.manager_id}`);

    // Check leads where team_code in source or status is Queued for this team
    // Actually, check any leads where source or notes mentions Team Fire?
    const { count: teamLeadCount } = await supabase
        .from('leads')
        .select('*', { count: 'exact', head: true })
        .ilike('source', `%${user.team_code}%`);
    
    console.log(`Leads with '${user.team_code}' in source: ${teamLeadCount}`);

    // Check status distribution
    const { data: statusCounts, error } = await supabase
        .from('leads')
        .select('status');
        
    if (statusCounts) {
        const counts = {};
        statusCounts.forEach(l => counts[l.status] = (counts[l.status] || 0) + 1);
        console.log('\nGlobal status counts:');
        console.table(counts);
    }
}

checkTeamAssignments().catch(console.error);
