const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://vewqzsqddgmkslnuctvb.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDUzMDQ2MiwiZXhwIjoyMDgwMTA2NDYyfQ.pAgMGN6MtKm1A3fsKr1GIt8-qmKYhwFjSt92L_6_7us';
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function checkHimanshu() {
    console.log('🔍 INVESTIGATING HIMANSHU...');

    // 1. Get Himanshu User
    const { data: users, error } = await supabase
        .from('users')
        .select('*')
        .ilike('name', '%Himanshu%');

    if (error) { console.error(error); return; }
    if (!users || users.length === 0) { console.log('❌ No user found with name "Himanshu"'); return; }

    const istOffset = 5.5 * 60 * 60 * 1000;
    const nowBox = new Date(Date.now() + istOffset);
    nowBox.setUTCHours(0, 0, 0, 0);
    const startOfTodayIST_inUTC = new Date(nowBox.getTime() - istOffset).toISOString();

    for (const u of users) {
        console.log(`\n👤 User: ${u.name} (ID: ${u.id})`);
        console.log(`   - Daily Limit: ${u.daily_limit}`);
        console.log(`   - DB leads_today: ${u.leads_today}`);

        // Count actual leads
        const { count, error: cErr } = await supabase
            .from('leads')
            .select('*', { count: 'exact', head: true })
            .eq('assigned_to', u.id)
            .gte('created_at', startOfTodayIST_inUTC);

        if (cErr) { console.error('   Error counting leads:', cErr); continue; }

        console.log(`   - ACTUAL Lead Count: ${count}`);

        if (u.leads_today !== count) {
            console.log(`   ⚠️ DISCREPANCY DETECTED! updating...`);
            // Fix it immediately just for him to be sure
            const { error: updateErr } = await supabase
                .from('users')
                .update({ leads_today: count })
                .eq('id', u.id);

            if (!updateErr) console.log(`   ✅ Corrected leads_today to ${count}`);
            else console.error(`   ❌ Failed to update: ${updateErr.message}`);
        } else {
            console.log(`   ✅ Counts Match.`);
        }
    }
}

checkHimanshu();
