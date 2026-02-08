
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://vewqzsqddgmkslnuctvb.supabase.co';
const SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDUzMDQ2MiwiZXhwIjoyMDgwMTA2NDYyfQ.pAgMGN6MtKm1A3fsKr1GIt8-qmKYhwFjSt92L_6_7us";

const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

async function detectiveSearch() {
    console.log("🕵️‍♂️ Detective Mode: Hunting for 'dbrar'...");

    // 1. Search in Public Users Table (by name or partial email)
    const { data: users } = await supabase.from('users')
        .select('*')
        .or('email.ilike.%dbar%,email.ilike.%brar%,email.ilike.%8826%,name.ilike.%Akash%,name.ilike.%Dbrar%');

    if (users && users.length > 0) {
        console.log(`✅ Found ${users.length} Potential Matches:`);
        console.table(users.map(u => ({
            Name: u.name,
            Email: u.email,
            Plan: u.plan_name,
            ValidUntil: u.valid_until
        })));
    } else {
        console.log("❌ No trace found in Public Users.");

        // 2. Search Auth Users (Harder to search partially, but let's try listing all)
        console.log("Listing ALL Auth Users to find needle in haystack...");
        const { data: { users: authUsers } } = await supabase.auth.admin.listUsers();

        const match = authUsers.filter(u =>
            u.email.includes("8826") ||
            u.email.includes("dbrar") ||
            u.email.includes("akash")
        );

        if (match.length > 0) {
            console.log(`FOUND IN AUTH (${match.length}):`);
            match.forEach(m => console.log(`- ${m.email} (${m.id})`));
        } else {
            console.log("❌ Not found in Auth either. Provide exact email or phone.");
        }
    }
}

detectiveSearch();
