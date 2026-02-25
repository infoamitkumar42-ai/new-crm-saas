const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://vewqzsqddgmkslnuctvb.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDUzMDQ2MiwiZXhwIjoyMDgwMTA2NDYyfQ.pAgMGN6MtKm1A3fsKr1GIt8-qmKYhwFjSt92L_6_7us';
const supabase = createClient(supabaseUrl, supabaseKey);

(async () => {
    // Shivani ID
    const userId = '189c29f1-429c-405b-a80b-f21597331bd7'; // Shivani
    const startOfDay = new Date();
    startOfDay.setUTCHours(0, 30, 0, 0);

    console.log(`--- 🔄 RECLAIMING LEADS FROM SHIVANI (Keep Top 3) 🔄 ---`);

    // 1. Fetch Assigned Leads since Morning, ASCENDING (Oldest First)
    const { data: leads, error } = await supabase
        .from('leads')
        .select('id, created_at, status')
        .eq('assigned_to', userId)
        .gte('created_at', startOfDay.toISOString())
        .order('created_at', { ascending: true }); // Oldest first

    if (error) { console.error(error); return; }

    console.log(`Found ${leads.length} leads assigned to Shivani today.`);

    if (leads.length <= 3) {
        console.log(`Leads count is ${leads.length}, which is <= 3. No reclamation needed.`);
        return;
    }

    // 2. Separate Keep vs Reclaim
    const keepLeads = leads.slice(0, 3);
    const reclaimLeads = leads.slice(3);

    console.log(`Keeping: ${keepLeads.length} leads.`);
    console.log(`Reclaiming: ${reclaimLeads.length} leads (Setting to Orphan).`);

    const reclaimIds = reclaimLeads.map(l => l.id);

    // 3. Batch Update (Reclaim)
    const { error: updateError } = await supabase
        .from('leads')
        .update({
            assigned_to: null,
            user_id: null,
            status: 'Orphan', // User requested "fresh save" / "orphan"
            notes: 'Reclaimed from Shivani (Manual Halt 2026-02-19)'
        })
        .in('id', reclaimIds);

    if (updateError) {
        console.error('Failed to reclaim leads:', updateError);
        return;
    }

    console.log('✅ Leads reclaimed successfully.');

    // 4. Update Shivani Counters
    // leads_today = 3
    // total_leads_received = (current_total - reclaimed_count)

    const { data: user } = await supabase.from('users').select('total_leads_received').eq('id', userId).single();
    const currentTotal = user.total_leads_received || 0;
    const newTotal = Math.max(0, currentTotal - reclaimLeads.length);

    console.log(`Updating Counters: LeadsToday=3, Total=${newTotal} (Prev=${currentTotal})`);

    const { error: userError } = await supabase
        .from('users')
        .update({
            leads_today: 3,
            total_leads_received: newTotal
        })
        .eq('id', userId);

    if (userError) console.error('Failed to update User:', userError);
    else console.log('✅ User Counters Updated.');

})();
