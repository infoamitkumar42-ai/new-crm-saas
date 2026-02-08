
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://vewqzsqddgmkslnuctvb.supabase.co';
const SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDUzMDQ2MiwiZXhwIjoyMDgwMTA2NDYyfQ.pAgMGN6MtKm1A3fsKr1GIt8-qmKYhwFjSt92L_6_7us";

const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

async function findAuthId() {
    console.log("🕵️ FINDING AUTH ID for info.amitkumar42@gmail.com...");

    let page = 0;
    let found = false;

    while (!found) {
        const { data: { users }, error } = await supabase.auth.admin.listUsers({
            page: page,
            perPage: 100
        });

        if (error || !users || users.length === 0) break;

        const target = users.find(u => u.email === 'info.amitkumar42@gmail.com');
        if (target) {
            console.log(`✅ FOUND AUTH ID: ${target.id}`);
            found = true;
        }

        page++;
        if (page > 10) break; // Safety limit
    }

    if (!found) {
        console.log("❌ COULD NOT FIND USER IN AUTH DB.");
    }
}

findAuthId();
