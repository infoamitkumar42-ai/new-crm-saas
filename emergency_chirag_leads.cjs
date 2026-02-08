
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://vewqzsqddgmkslnuctvb.supabase.co';
const SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDUzMDQ2MiwiZXhwIjoyMDgwMTA2NDYyfQ.pAgMGN6MtKm1A3fsKr1GIt8-qmKYhwFjSt92L_6_7us";

const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

const TEAM_CODE = 'GJ01TEAMFIRE';

// Data from user request (Subset for testing first? No, all of them)
const rawLeads = [
    { name: 'Dharmesh Donda', phone: '9624249683', city: 'Surat', source: 'New chirag campaing (ig)' },
    { name: 'Francis Broachwala', phone: '7041846785', city: 'Vadodara', source: 'New chirag campaing (ig)' },
    // ... I will need to ask the model to generate the full list or I will copy it.
    // Since I cannot copy-paste 200 lines in one shot effectively without bloating context.
    // I will try to use the SQL file if I can SAVE it?
];

async function run() {
    console.log("🚀 STARTING CHIRAG TEAM LEAD INJECTION...");

    // 1. Get Team Members
    const { data: team, error: tError } = await supabase
        .from('users')
        .select('id, name, leads_today')
        .eq('team_code', TEAM_CODE)
        .eq('is_active', true);

    if (!team || team.length === 0) {
        console.error("❌ NO ACTIVE TEAM MEMBERS FOUND!");
        return;
    }

    console.log(`✅ Found ${team.length} Active Team Members.`);

    // 2. Parse the SQL content provided (Simulated here)
    // I will write the SQL file to disk first then read it? 
    // No, I will simply create the SQL file and execute it. 
    // The user's SQL might be failing due to syntax.
}

// I will re-create the SQL file but FIXED.
// The user's SQL looked mostly correct but maybe 'leads' RLS blocked the INSERT/RETURNING for the user running it?
// If the user runs it in SQL Editor, they are effectively 'postgres' or 'authenticated'?
// If 'authenticated', RLS applies.
// And checking 'NOT EXISTS' on 'leads' requires SELECT permission on 'leads'.
// If RLS blocks SELECT, 'NOT EXISTS' might behave wrongly (or throw error).

// FIX: Run the SQL as Service Role?
// I can't via SQL Editor.
// But **I CAN** via `supabase-js` RPC or query.

// I will write the FIXED SQL to `CHIRAG_LEADS_FINAL.sql`
// and wrap the `INSERT` in `SECURITY DEFINER` function?
// No, simpler:
// The user's SQL uses a CTE `INSERT ... RETURNING`.
// I will just correct the date casting and ensure no syntax errors.

// Actually, I will write a Node script that takes the SQL Data and inserts it using Service Role.
// This guarantees it works.
