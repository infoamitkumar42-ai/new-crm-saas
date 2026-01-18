import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://vewqzsqddgmkslnuctvb.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDUzMDQ2MiwiZXhwIjoyMDgwMTA2NDYyfQ.pAgMGN6MtKm1A3fsKr1GIt8-qmKYhwFjSt92L_6_7us';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function identifyBadAssignments() {
    console.log('\n👮 --- AUDIT: INELIGIBLE ASSIGNMENTS ---\n');

    const now = new Date().toISOString();
    const startToday = new Date();
    startToday.setHours(0, 0, 0, 0);

    // 1. Get Ineligible Users (Limit=0 OR Expired)
    const { data: allUsers } = await supabase
        .from('users')
        .select('id, name, daily_limit, valid_until');

    const ineligibleIds = new Set();
    const ineligibleMap = {};

    allUsers.forEach(u => {
        const isExpired = u.valid_until && new Date(u.valid_until) < new Date();
        const isPaused = u.daily_limit === 0;

        // Strict: Must have valid date AND limit > 0
        // What about valid_until is null? Assume ineligible if user said "paid only"? 
        // Let's assume null is OKAY if limit > 0 (Admin?), but Expired is definitely BAD.
        // And Limit=0 is definitely BAD.

        if (isPaused || isExpired) {
            ineligibleIds.add(u.id);
            ineligibleMap[u.id] = { name: u.name, reason: isPaused ? 'Limit=0' : 'Expired' };
        }
    });

    console.log(`Identified ${ineligibleIds.size} Ineligible Users (Paused/Expired).`);

    // 2. Check Assignments
    const { data: assignments } = await supabase
        .from('leads')
        .select('id, name, assigned_to')
        .gte('created_at', startToday.toISOString())
        .not('assigned_to', 'is', null);

    const badLeads = [];

    assignments.forEach(l => {
        if (ineligibleIds.has(l.assigned_to)) {
            badLeads.push({
                lead_id: l.id,
                lead_name: l.name,
                assigned_to: l.assigned_to,
                user_name: ineligibleMap[l.assigned_to].name,
                reason: ineligibleMap[l.assigned_to].reason
            });
        }
    });

    if (badLeads.length > 0) {
        console.log(`\n🚨 FOUND ${badLeads.length} WRONG ASSIGNMENTS!`);
        console.log("(Leads assigned to Paused/Expired users):");

        // Group by User
        const userGroup = {};
        badLeads.forEach(l => {
            userGroup[l.user_name] = (userGroup[l.user_name] || 0) + 1;
        });

        for (const [name, count] of Object.entries(userGroup)) {
            console.log(`- ${name}: ${count} Leads (${badLeads.find(l => l.user_name === name).reason})`);
        }

    } else {
        console.log("✅ No leads assigned to Paused/Expired users.");
    }
}

identifyBadAssignments();
