const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://vewqzsqddgmkslnuctvb.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDUzMDQ2MiwiZXhwIjoyMDgwMTA2NDYyfQ.pAgMGN6MtKm1A3fsKr1GIt8-qmKYhwFjSt92L_6_7us';
const supabase = createClient(supabaseUrl, supabaseKey);

const HIMANSHU_KEYWORDS = ['TFE 6444', 'Himanshu Sharma', 'Work With Himanshu', 'Digital Skills India'];

(async () => {
    console.log('--- 📊 FINAL AUDIT: HIMANSHU LEAD RECIPIENTS ---');

    const { data: leads, error } = await supabase
        .from('leads')
        .select(`
            id, name, source, status, created_at, 
            users!leads_assigned_to_fkey(name, email, team_code)
        `)
        .gte('created_at', '2026-02-18T00:00:00Z');

    if (error) {
        console.error('Error:', error);
        return;
    }

    const hLeads = leads.filter(l => l.source && HIMANSHU_KEYWORDS.some(k => l.source.includes(k)));
    const assigned = hLeads.filter(l => l.assigned_to && l.users);

    const stats = {};
    assigned.forEach(l => {
        const key = `${l.users.name} (${l.users.email}) [${l.users.team_code}]`;
        stats[key] = (stats[key] || 0) + 1;
    });

    console.log(JSON.stringify(stats, null, 2));

    const misplaced = assigned.filter(l => l.users.team_code === 'GJ01TEAMFIRE' || l.users.email === 'nitinanku628@gmail.com');
    console.log(`\nMisplaced Leads Found: ${misplaced.length}`);
    misplaced.forEach(l => {
        console.log(`- Lead: ${l.name} | Assigned To: ${l.users.name} (${l.users.email})`);
    });

})();
