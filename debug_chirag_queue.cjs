const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = "https://vewqzsqddgmkslnuctvb.supabase.co";
const SUPABASE_SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDUzMDQ2MiwiZXhwIjoyMDgwMTA2NDYyfQ.pAgMGN6MtKm1A3fsKr1GIt8-qmKYhwFjSt92L_6_7us";

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function debugQueue() {
    console.log("🔍 Simulating Lead Distribution Queue for Chirag's Team...");

    const managerIds = [
        '8c653bc9-eb28-45d7-b658-4b3694956171',
        '460e0444-25a8-4ac9-9260-ce21be97aab3',
        'aac2b76b-0794-49e2-a030-91711ab5ecff',
        'c4c71cbb-6000-4137-b72f-2c07be2179e7',
        'a98f9160-17e8-4eac-904c-0518705fa67c'
    ];

    // Fetch Eligible Users
    const { data: users, error } = await supabase
        .from('users')
        .select('name, email, leads_today, daily_limit, last_assigned_at, is_online, is_active, payment_status')
        .in('manager_id', managerIds)
        .eq('is_active', true)
        .eq('is_online', true)
        .eq('payment_status', 'active');

    if (error) {
        console.error("❌ Error fetching users:", error);
        return;
    }

    // Filter out those who hit daily limit
    const eligible = users.filter(u => u.leads_today < u.daily_limit);

    // SORT LOGIC (Standard Round Robin)
    // 1. Leads Today (Ascending) - Give to those with fewest leads
    // 2. Last Assigned At (Ascending) - Give to those waiting longest
    eligible.sort((a, b) => {
        if (a.leads_today !== b.leads_today) {
            return a.leads_today - b.leads_today;
        }
        const timeA = a.last_assigned_at ? new Date(a.last_assigned_at).getTime() : 0;
        const timeB = b.last_assigned_at ? new Date(b.last_assigned_at).getTime() : 0;
        return timeA - timeB;
    });

    console.log(`\n📋 QUEUE ORDER (Top 10 Priority):`);
    console.log(`Pos | Name                      | Leads | Last Assigned`);
    console.log(`----|---------------------------|-------|--------------------------`);

    eligible.slice(0, 15).forEach((u, index) => {
        const isSonal = u.email.includes('sonalben');
        const marker = isSonal ? "👉" : "  ";
        const last = u.last_assigned_at ? new Date(u.last_assigned_at).toLocaleTimeString() : "NEVER";

        console.log(`${marker}${index + 1} | ${u.name.padEnd(25)} |   ${u.leads_today}   | ${last}`);
    });

    const sonal = users.find(u => u.email.includes('sonalben'));
    if (sonal) {
        if (sonal.leads_today >= sonal.daily_limit) {
            console.log("\n⚠️ Sonal is NOT in queue: Daily Limit Reached!");
        } else if (!sonal.is_online) {
            console.log("\n⚠️ Sonal is NOT in queue: Offline!");
        } else {
            const pos = eligible.findIndex(u => u.email.includes('sonalben'));
            console.log(`\n🎯 Sonal Position: #${pos + 1} in line.`);
        }
    } else {
        console.log("\n❌ Sonal not found in active/online list?");
    }
}

debugQueue();
