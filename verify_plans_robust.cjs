
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://vewqzsqddgmkslnuctvb.supabase.co';
const SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDUzMDQ2MiwiZXhwIjoyMDgwMTA2NDYyfQ.pAgMGN6MtKm1A3fsKr1GIt8-qmKYhwFjSt92L_6_7us";

const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

async function checkWideRobust() {
    console.log("🕵️‍♂️ Checking ALL assigned 'facebook' leads (Robust)...");

    const { data: leads, error: lErr } = await supabase.from('leads')
        .select('assigned_to, source')
        .or('source.eq.facebook,source.eq.Facebook Orphan Rescue')
        .eq('status', 'Assigned');

    if (lErr) { console.error(lErr); return; }
    if (!leads || leads.length === 0) { console.log("No leads found."); return; }

    const userIds = [...new Set(leads.map(l => l.assigned_to).filter(Boolean))];
    console.log(`Checking ${userIds.length} Unique Users against Plan Expiry...`);

    const { data: users, error: uErr } = await supabase.from('users')
        .select('id, name, valid_until, plan_name')
        .in('id', userIds);

    if (uErr) { console.error(uErr); return; }

    const badUsers = [];
    const now = new Date();

    users.forEach(u => {
        let isValid = false;
        if (u.valid_until) {
            const d = new Date(u.valid_until);
            if (d > now) isValid = true;
        }

        if (!isValid) {
            badUsers.push({ Name: u.name, Plan: u.plan_name, ValidUntil: u.valid_until });
        }
    });

    if (badUsers.length > 0) {
        console.error(`\n❌ FOUND ${badUsers.length} EXPIRED/UNPAID USERS:`);
        console.table(badUsers);
    } else {
        console.log("✅ ALL USERS ARE VALID PAID MEMBERS.");
    }
}

checkWideRobust();
