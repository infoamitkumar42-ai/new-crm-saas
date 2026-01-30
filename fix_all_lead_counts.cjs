const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://vewqzsqddgmkslnuctvb.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDUzMDQ2MiwiZXhwIjoyMDgwMTA2NDYyfQ.pAgMGN6MtKm1A3fsKr1GIt8-qmKYhwFjSt92L_6_7us';
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function fixAll() {
    console.log('🔧 FIXING LEADS_TODAY COUNTS FOR ALL ACTIVE USERS...');

    // Time setup
    const istOffset = 5.5 * 60 * 60 * 1000;
    const nowBox = new Date(Date.now() + istOffset);
    nowBox.setUTCHours(0, 0, 0, 0);
    const startOfTodayIST_inUTC = new Date(nowBox.getTime() - istOffset).toISOString();

    // 1. Get Users
    const { data: users, error } = await supabase
        .from('users')
        .select('id, name, leads_today')
        .eq('is_active', true);

    if (error) { console.error(error); return; }

    // 2. Get Real Counts
    const { data: leads, error: lErr } = await supabase
        .from('leads')
        .select('assigned_to')
        .gte('created_at', startOfTodayIST_inUTC);

    if (lErr) { console.error(lErr); return; }

    const realCounts = {};
    leads.forEach(l => {
        if (l.assigned_to) realCounts[l.assigned_to] = (realCounts[l.assigned_to] || 0) + 1;
    });

    let fixedCount = 0;

    for (const u of users) {
        const real = realCounts[u.id] || 0;
        const stored = u.leads_today || 0;

        if (real !== stored) {
            console.log(`🛠️ Fixing ${u.name}: ${stored} -> ${real}`);

            const { error: upErr } = await supabase
                .from('users')
                .update({ leads_today: real })
                .eq('id', u.id);

            if (!upErr) fixedCount++;
        }
    }

    console.log(`✅ Completed. Fixed ${fixedCount} users.`);
}

fixAll();
