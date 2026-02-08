
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://vewqzsqddgmkslnuctvb.supabase.co';
const SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDUzMDQ2MiwiZXhwIjoyMDgwMTA2NDYyfQ.pAgMGN6MtKm1A3fsKr1GIt8-qmKYhwFjSt92L_6_7us";

const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

async function checkChiragAdCount() {
    console.log("🌙 CHIRAG PAGE LEAD AUDIT (Ad Manager Comparison)...\n");

    const today = new Date().toISOString().split('T')[0];

    // Get ALL leads where Source contains "Meta", "Digital Chirag", "Sync"
    // And assigned to Chirag's Team Users

    // 1. Get Team IDs
    const { data: users } = await supabase.from('users').select('id').eq('team_code', 'GJ01TEAMFIRE');
    const userIds = users.map(u => u.id);

    // 2. Count Leads
    const { data: leads } = await supabase.from('leads')
        .select('source, created_at')
        .in('assigned_to', userIds)
        .gte('created_at', today + 'T00:00:00');

    if (!leads) return;

    let total = leads.length;
    let meta = 0;
    let recovery = 0;
    let manual = 0;

    leads.forEach(l => {
        const s = (l.source || '').toLowerCase();
        if (s.includes('recovery') || s.includes('sync')) recovery++;
        else if (s.includes('meta') || s.includes('digital chirag')) meta++;
        else manual++;
    });

    console.log(`📊 CRM TOTAL:        ${total}`);
    console.log(`   - Direct Webhook: ${meta}`);
    console.log(`   - API Recovery:   ${recovery}`);
    console.log(`   - Other/Manual:   ${manual}`);

    console.log(`\n🎯 AD MANAGER SAYS:  268`);

    const diff = 268 - total;
    if (diff > 5) {
        console.log(`🚨 MISSING IN CRM:   ${diff} Leads`);
        console.log(`   (Possibility: Duplicates filtered out, or Token API delay?)`);
    } else if (diff < -5) {
        console.log(`⚠️ EXTRA IN CRM:     ${Math.abs(diff)} Leads`);
    } else {
        console.log(`✅ MATCHED! (Difference is negligible/duplicates)`);
    }
}

checkChiragAdCount();
