import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://vewqzsqddgmkslnuctvb.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDUzMDQ2MiwiZXhwIjoyMDgwMTA2NDYyfQ.pAgMGN6MtKm1A3fsKr1GIt8-qmKYhwFjSt92L_6_7us';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function auditDistribution() {
    console.log('\n📊 --- AUDIT: WHERE DID THE 176 LEADS GO? ---\n');

    const startToday = new Date();
    startToday.setHours(0, 0, 0, 0);

    // Fetch all leads assigned today
    const { data: leads, error } = await supabase
        .from('leads')
        .select('assigned_to, source, name')
        .gte('created_at', startToday.toISOString())
        .not('assigned_to', 'is', null);

    if (error) {
        console.error("Error:", error.message);
        return;
    }

    console.log(`Total Leads Found Today: ${leads.length}`);

    // Map counts per user
    const userCounts = {};
    leads.forEach(l => {
        userCounts[l.assigned_to] = (userCounts[l.assigned_to] || 0) + 1;
    });

    // Fetch User Names
    const { data: users } = await supabase
        .from('users')
        .select('id, name');

    const nameMap = {};
    users.forEach(u => nameMap[u.id] = u.name);

    // Sort users by count (Highest first)
    const sortedUsers = Object.keys(userCounts)
        .map(id => ({ name: nameMap[id] || 'Unknown/Deleted', count: userCounts[id], id }))
        .sort((a, b) => b.count - a.count);

    console.log("\n🏆 TOP RECEIVERS (The 'Fat' Users):");
    sortedUsers.slice(0, 15).forEach((u, i) => {
        console.log(`${i + 1}. ${u.name}: ${u.count} Leads`);
    });

    console.log("\n... (Middle users)...");

    console.log("\n📉 BOTTOM RECEIVERS:");
    sortedUsers.slice(-10).forEach((u, i) => {
        console.log(`${sortedUsers.length - 10 + i + 1}. ${u.name}: ${u.count} Leads`);
    });

    // Analyze "Over-served" leads (Anyone with > 3 leads)
    // Assume fair share is ~2-3
    const threshold = 3;
    let excessLeads = 0;
    sortedUsers.forEach(u => {
        if (u.count > threshold) {
            excessLeads += (u.count - threshold);
        }
    });

    console.log(`\n💡 INSIGHT:`);
    console.log(`- We have ${sortedUsers.length} users who got leads.`);
    console.log(`- Some got way more than average (e.g. ${sortedUsers[0].name} has ${sortedUsers[0].count}).`);
    console.log(`- Total 'Excess' Leads (above ${threshold}/user): ~${excessLeads}`);
    console.log(`- This explains why 50 others got 0. The distribution wasn't Round-Robin across EVERYONE, it repeated on the top list.`);
}

auditDistribution();
