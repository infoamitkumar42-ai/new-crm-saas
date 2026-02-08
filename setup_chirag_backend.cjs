
const { createClient } = require('@supabase/supabase-js');

// Use Service Role Key for Admin Access
const SUPABASE_URL = 'https://vewqzsqddgmkslnuctvb.supabase.co';
const SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDUzMDQ2MiwiZXhwIjoyMDgwMTA2NDYyfQ.pAgMGN6MtKm1A3fsKr1GIt8-qmKYhwFjSt92L_6_7us";

const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

async function run() {
    console.log('🚀 STARTING CHIRAG BACKEND SETUP...');

    // 1. MAP PAGE (Using ID from Screenshot)
    console.log('🔗 Mapping Page ID: 928347267036761...');
    const { error: e1 } = await supabase.from('meta_pages').upsert({
        page_id: '928347267036761',
        page_name: 'Digital Chirag',
        team_id: 'GJ01TEAMFIRE'
    });
    if (e1) console.error('❌ Page Map Error:', e1);
    else console.log('✅ Page Mapped: Digital Chirag -> GJ01TEAMFIRE');

    // 2. MAP BHUMIT (Just in case)
    await supabase.from('meta_pages').upsert({
        page_id: '61586060581800',
        page_name: 'Bhumit Godhani',
        team_id: 'GJ01TEAMFIRE'
    });
    console.log('✅ Page Mapped: Bhumit Godhani -> GJ01TEAMFIRE');

    // 3. ACTIVATE TEAM
    console.log('🔥 Activating GJ01TEAMFIRE Members...');
    const today = new Date();
    today.setDate(today.getDate() + 30); // 30 Days Validity

    const { error: e2, data: updatedUsers } = await supabase.from('users')
        .update({
            is_active: true,
            is_online: true,
            payment_status: 'active',
            valid_until: today.toISOString(),
            daily_limit: 50,
            updated_at: new Date().toISOString()
        })
        .eq('team_code', 'GJ01TEAMFIRE')
        .select('id');

    if (e2) console.error('❌ Team Activation Error:', e2);
    else console.log(`✅ Activated ${updatedUsers?.length || 0} members of GJ01TEAMFIRE`);

    // 4. MANAGER LIMIT (Chirag)
    const { error: e3 } = await supabase.from('users')
        .update({ daily_limit: 100 })
        .ilike('name', '%Chirag%')
        .eq('team_code', 'GJ01TEAMFIRE');

    if (e3) console.error('❌ Manager Limit Error:', e3);
    else console.log('✅ Chirag Personal Limit Set to 100');

    console.log('🏁 SETUP COMPLETE.');
}

run();
