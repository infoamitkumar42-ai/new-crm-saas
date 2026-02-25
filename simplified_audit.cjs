const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://vewqzsqddgmkslnuctvb.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDUzMDQ2MiwiZXhwIjoyMDgwMTA2NDYyfQ.pAgMGN6MtKm1A3fsKr1GIt8-qmKYhwFjSt92L_6_7us';
const supabase = createClient(supabaseUrl, supabaseKey);

const HIMANSHU_KEYWORDS = ['TFE 6444', 'Himanshu Sharma', 'Work With Himanshu', 'Digital Skills India'];

(async () => {
    console.log('--- 📊 Auditing Himanshu Leads Today ---');

    const { data: leads, error } = await supabase
        .from('leads')
        .select('*')
        .gte('created_at', '2026-02-18T00:00:00Z');

    if (error) {
        console.error(error);
        return;
    }

    const hLeads = leads.filter(l => l.source && HIMANSHU_KEYWORDS.some(k => l.source.includes(k)));
    console.log(`Total Himanshu Leads: ${hLeads.length}`);

    const recipients = hLeads.filter(l => l.assigned_to);
    console.log(`Assigned Leads: ${recipients.length}`);

    const userIds = [...new Set(recipients.map(l => l.assigned_to))];
    const { data: users } = await supabase.from('users').select('id, name, email, team_code').in('id', userIds);
    const userMap = Object.fromEntries(users.map(u => [u.id, u]));

    const stats = {};
    recipients.forEach(l => {
        const u = userMap[l.assigned_to];
        const key = u ? `${u.name} (${u.email}) [${u.team_code}]` : 'Unknown User';
        stats[key] = (stats[key] || 0) + 1;
    });

    console.log('\nBreakdown by recipient:');
    console.log(JSON.stringify(stats, null, 2));

    const misplaced = recipients.filter(l => {
        const u = userMap[l.assigned_to];
        return u && (u.team_code === 'GJ01TEAMFIRE' || u.email === 'nitinanku628@gmail.com');
    });

    console.log(`\nMisplaced leads specifically: ${misplaced.length}`);
    misplaced.forEach(l => {
        const u = userMap[l.assigned_to];
        console.log(`- Lead: ${l.name} | Assigned To: ${u.name} (${u.email})`);
    });
})();
