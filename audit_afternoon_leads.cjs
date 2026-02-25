const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://vewqzsqddgmkslnuctvb.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDUzMDQ2MiwiZXhwIjoyMDgwMTA2NDYyfQ.pAgMGN6MtKm1A3fsKr1GIt8-qmKYhwFjSt92L_6_7us';
const supabase = createClient(supabaseUrl, supabaseKey);

(async () => {
    // 12 PM IST Today = 06:30 UTC
    // Let's use a safe window. 
    // ISO String for 2026-02-19T12:00:00+05:30 is 2026-02-19T06:30:00.000Z

    // BUT WAIT! The server time might be different or the user might mean "noon".
    // Let's just hardcode the ISO timestamp for 12:00 PM IST today to be precise.
    const START_TIME_ISO = '2026-02-19T06:30:00.000Z';

    console.log(`--- 📊 AFTERNOON LEAD AUDIT (Since 12:00 PM IST) 📊 ---`);
    console.log(`Time Filter: >= ${START_TIME_ISO}\n`);

    // 1. Fetch Leads
    const { data: leads, error } = await supabase
        .from('leads')
        .select('id, name, phone, city, status, source, assigned_to, user_id, created_at')
        .gte('created_at', START_TIME_ISO)
        .order('created_at', { ascending: false });

    if (error) { console.error(error); return; }

    console.log(`Total Leads Generated: ${leads.length}\n`);

    // 2. Fetch User Names for Assignees
    const userIds = [...new Set(leads.map(l => l.assigned_to).filter(Boolean))];
    let userMap = {};
    if (userIds.length > 0) {
        const { data: users } = await supabase.from('users').select('id, name').in('id', userIds);
        users.forEach(u => userMap[u.id] = u.name);
    }

    // 3. Status Breakdown
    const statusCounts = {};
    const sourceCounts = {};
    const assigneeCounts = {};

    for (const l of leads) {
        // Status
        statusCounts[l.status] = (statusCounts[l.status] || 0) + 1;

        // Source - Clean up formatting
        const cleanSource = l.source ? l.source.replace('Meta - ', '') : 'Unknown';
        sourceCounts[cleanSource] = (sourceCounts[cleanSource] || 0) + 1;

        // Assignee
        if (l.assigned_to) {
            const name = userMap[l.assigned_to] || 'Unknown User';
            assigneeCounts[name] = (assigneeCounts[name] || 0) + 1;
        }
    }

    // 4. Print Report
    console.log(`--- STATUS BREAKDOWN ---`);
    console.table(statusCounts);

    console.log(`\n--- SOURCE BREAKDOWN (Page Wise) ---`);
    const sortedSources = Object.entries(sourceCounts).sort((a, b) => b[1] - a[1]);
    sortedSources.forEach(([src, count]) => {
        console.log(`${src.padEnd(40)} : ${count}`);
    });

    console.log(`\n--- RECIPIENT BREAKDOWN (Who got leads?) ---`);
    if (Object.keys(assigneeCounts).length === 0) {
        console.log("No leads assigned to users in this period.");
    } else {
        const sortedAssignees = Object.entries(assigneeCounts).sort((a, b) => b[1] - a[1]);
        sortedAssignees.forEach(([name, count]) => {
            console.log(`${name.padEnd(30)} : ${count}`);
        });
    }

    // 5. Shivani Check
    const shivaniId = '189c29f1-429c-405b-a80b-f21597331bd7';
    const shivaniLeads = leads.filter(l => l.assigned_to === shivaniId);
    console.log(`\n--- SHIVANI CHECK ---`);
    console.log(`Leads assigned to Shivani > 12 PM: ${shivaniLeads.length}`);

    // 6. Current Orphan Count Check (Total in DB, not just since 12 PM)
    const { count: totalOrphans } = await supabase
        .from('leads')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'Orphan')
        .gte('created_at', '2026-02-19T00:30:00.000Z'); // Since Morning

    console.log(`\n--- TOTAL ORPHAN POOL (Since Morning 6 AM) ---`);
    console.log(`Total Orphans Available: ${totalOrphans}`);

})();
