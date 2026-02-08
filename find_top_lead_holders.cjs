
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://vewqzsqddgmkslnuctvb.supabase.co';
const SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDUzMDQ2MiwiZXhwIjoyMDgwMTA2NDYyfQ.pAgMGN6MtKm1A3fsKr1GIt8-qmKYhwFjSt92L_6_7us";

const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

async function findTopHolders() {
    console.log("🏆 FINDING TOP LEAD HOLDERS (Since Jan 1, 2026)...\n");

    // 1. Get All Leads grouped by Assigned To
    const { data: leads } = await supabase.from('leads')
        .select('assigned_to')
        .gte('created_at', '2026-01-01T00:00:00');

    if (!leads) return console.log("No leads found.");

    // Count occurrences
    const counts = {};
    leads.forEach(l => {
        const id = l.assigned_to || 'UNASSIGNED';
        counts[id] = (counts[id] || 0) + 1;
    });

    // 2. Fetch User Names
    const userIds = Object.keys(counts).filter(id => id !== 'UNASSIGNED');
    const { data: users } = await supabase.from('users')
        .select('id, name, email')
        .in('id', userIds);

    const userMap = {};
    users.forEach(u => { userMap[u.id] = `${u.name} (${u.email})`; });
    userMap['UNASSIGNED'] = '❌ UNASSIGNED (No User)';

    // 3. Display Sorted List
    const sorted = Object.entries(counts)
        .map(([id, count]) => ({ Name: userMap[id] || `Unknown ID (${id})`, Count: count }))
        .sort((a, b) => b.Count - a.Count)
        .slice(0, 20); // Top 20

    console.table(sorted);
}

findTopHolders();
