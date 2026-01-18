import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://vewqzsqddgmkslnuctvb.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDUzMDQ2MiwiZXhwIjoyMDgwMTA2NDYyfQ.pAgMGN6MtKm1A3fsKr1GIt8-qmKYhwFjSt92L_6_7us';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function checkPaidVsFree() {
    console.log('\n👮 --- POLICE: PAID VS FREELOADER CHECK ---\n');

    const now = new Date().toISOString();
    const startToday = new Date();
    startToday.setHours(0, 0, 0, 0);

    // 1. Fetch ALL Users with their Expiry
    const { data: allUsers, error } = await supabase
        .from('users')
        .select('id, name, valid_until, daily_limit');

    if (error) {
        console.error("Error:", error.message);
        return;
    }

    // 2. Classify Users
    const paidUsers = new Set();
    const expiredUsers = new Set();
    const paidMap = {};
    const expiredMap = {};
    const freeMap = {}; // No expiry date (if any)

    allUsers.forEach(u => {
        if (!u.valid_until) {
            freeMap[u.id] = u;
        } else if (new Date(u.valid_until) > new Date()) {
            paidUsers.add(u.id);
            paidMap[u.id] = u;
        } else {
            expiredUsers.add(u.id);
            expiredMap[u.id] = u;
        }
    });

    console.log(`User Stats:`);
    console.log(`✅ PAID Active Users: ${paidUsers.size}`);
    console.log(`❌ EXPIRED/Unpaid Users: ${expiredUsers.size}`);
    console.log(`⚪ No Expiry (Lifetime?): ${Object.keys(freeMap).length}`);

    // 3. Check Today's Assignments
    const { data: assignments } = await supabase
        .from('leads')
        .select('id, name, assigned_to')
        .gte('created_at', startToday.toISOString())
        .not('assigned_to', 'is', null);

    console.log(`\nChecking ${assignments.length} assignments from today...`);

    const wastedLeads = [];
    assignments.forEach(l => {
        if (expiredUsers.has(l.assigned_to)) {
            wastedLeads.push({
                lead_id: l.id,
                lead_name: l.name,
                assigned_to_name: expiredMap[l.assigned_to].name,
                user_id: l.assigned_to
            });
        }
    });

    if (wastedLeads.length > 0) {
        console.log(`\n🚨 SCANDAL! ${wastedLeads.length} Leads assigned to EXPIRED/UNPAID Users!`);
        console.log("Names of Freeloaders:");
        const freeloaderNames = [...new Set(wastedLeads.map(l => l.assigned_to_name))];
        console.log(freeloaderNames.join(", "));

        console.log(`\n💡 RECOVERY ACTION:`);
        console.log(`Move these ${wastedLeads.length} leads to the REAL Paid Users (currently at 0).`);

        // Also check "Free/NoExpiry" users?
        // Let's assume ValidUntil is mandatory for Paid.

    } else {
        console.log("✅ All leads went to Paid/Active users. Distribution was correct.");
    }
}

checkPaidVsFree();
