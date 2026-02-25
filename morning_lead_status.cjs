const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://vewqzsqddgmkslnuctvb.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDUzMDQ2MiwiZXhwIjoyMDgwMTA2NDYyfQ.pAgMGN6MtKm1A3fsKr1GIt8-qmKYhwFjSt92L_6_7us';
const supabase = createClient(supabaseUrl, supabaseKey);

(async () => {
    // 6 AM IST
    const startOfDay = new Date();
    startOfDay.setUTCHours(0, 30, 0, 0);

    console.log(`--- ☀️ MORNING LEAD STATUS (Since 6 AM) ☀️ ---`);

    const { data: leads, error } = await supabase
        .from('leads')
        .select('id, status, assigned_to')
        .gte('created_at', startOfDay.toISOString());

    if (error) { console.error(error); return; }

    const statusCounts = {};
    const recipientCounts = {};
    const unassignedIds = [];

    for (const l of leads) {
        // Status Count
        statusCounts[l.status] = (statusCounts[l.status] || 0) + 1;

        // Recipient Count
        if (l.assigned_to) {
            recipientCounts[l.assigned_to] = (recipientCounts[l.assigned_to] || 0) + 1;
        } else {
            unassignedIds.push(l.id);
        }
    }

    console.log('\n--- LEAD STATUS BREAKDOWN ---');
    console.table(statusCounts);

    console.log('\n--- TOP RECIPIENTS ---');
    // Fetch names for top 10 recipients
    const topRecipientIds = Object.entries(recipientCounts)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 10)
        .map(([id]) => id);

    if (topRecipientIds.length > 0) {
        const { data: users } = await supabase.from('users').select('id, name, plan_name').in('id', topRecipientIds);
        const userMap = {};
        users.forEach(u => userMap[u.id] = u);

        const report = topRecipientIds.map(id => ({
            Name: userMap[id]?.name || 'Unknown',
            Plan: userMap[id]?.plan_name || 'N/A',
            Leads: recipientCounts[id]
        }));
        console.table(report);
    } else {
        console.log("No leads assigned yet.");
    }

})();
