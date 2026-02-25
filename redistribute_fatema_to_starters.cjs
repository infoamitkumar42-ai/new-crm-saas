const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://vewqzsqddgmkslnuctvb.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDUzMDQ2MiwiZXhwIjoyMDgwMTA2NDYyfQ.pAgMGN6MtKm1A3fsKr1GIt8-qmKYhwFjSt92L_6_7us';
const supabase = createClient(supabaseUrl, supabaseKey);

(async () => {
    console.log(`--- ♻️ FATEMA REDISTRIBUTION TO STARTERS ♻️ ---`);

    const fatemaId = '0d5d64b1-011c-4ee8-902a-de9ddca08115';
    const starters = [
        { id: '113909a7-b3fe-4f67-887a-3e2af5d6e89e', name: 'VANRAJ SINH VAJA' },
        { id: '4271e489-b65a-4bd7-9887-ce07a00708c9', name: 'Krupal rathod' }
    ];

    // 1. Fetch 16 Latest Leads from Fatema to Reclaim
    console.log("Fetching 16 latest leads from Fatema...");
    const { data: fatemaLeads, error: fError } = await supabase
        .from('leads')
        .select('id, name')
        .eq('assigned_to', fatemaId)
        .order('assigned_at', { ascending: false }) // Newest first
        .limit(16);

    if (fError) { console.error('Error fetching Fatema leads:', fError); return; }
    console.log(`Found ${fatemaLeads.length} leads to reclaim from Fatema.`);

    // 2. Fetch Existing Orphans (Limit 20 to be safe, we expect ~14)
    console.log("Fetching existing orphans from Chirag...");
    const { data: orphans, error: oError } = await supabase
        .from('leads')
        .select('id, name')
        .eq('status', 'Orphan')
        .ilike('source', '%Chirag%')
        .limit(50); // Fetch all available

    if (oError) { console.error('Error fetching orphans:', oError); return; }
    console.log(`Found ${orphans.length} existing orphan leads.`);

    // 3. Combine Pool
    const pool = [...fatemaLeads, ...orphans];
    console.log(`\nTOTAL REDISTRIBUTION POOL: ${pool.length} LEADS`);

    // 4. Distribute Round Robin
    let assignedCount = 0;

    for (let i = 0; i < pool.length; i++) {
        const lead = pool[i];
        const user = starters[i % starters.length];

        console.log(`Assigning Lead ${i + 1}: ${lead.name} -> ${user.name}`);

        const { error: updateError } = await supabase
            .from('leads')
            .update({
                status: 'Assigned',
                assigned_to: user.id,
                user_id: user.id,
                assigned_at: new Date().toISOString(),
                notes: 'Redistributed from Fatema/Orphans - 2026-02-19'
            })
            .eq('id', lead.id);

        if (updateError) {
            console.error(`Failed to assign ${lead.id}:`, updateError.message);
        } else {
            assignedCount++;
            // Increment User Counter
            const { error: rpcError } = await supabase.rpc('increment_leads_today_safe', { user_id: user.id });
            if (rpcError) {
                // Fallback manual
                const { data: u } = await supabase.from('users').select('leads_today, total_leads_received').eq('id', user.id).single();
                if (u) {
                    await supabase.from('users').update({
                        leads_today: (u.leads_today || 0) + 1,
                        total_leads_received: (u.total_leads_received || 0) + 1
                    }).eq('id', user.id);
                }
            }
        }
    }

    // 5. Update Fatema's Counter (Decrement)
    if (fatemaLeads.length > 0) {
        console.log(`\nDecrementing Fatema's counters by ${fatemaLeads.length}...`);
        const { data: fUser } = await supabase.from('users').select('leads_today, total_leads_received').eq('id', fatemaId).single();
        if (fUser) {
            await supabase.from('users').update({
                leads_today: Math.max(0, (fUser.leads_today || 0) - fatemaLeads.length),
                total_leads_received: Math.max(0, (fUser.total_leads_received || 0) - fatemaLeads.length)
            }).eq('id', fatemaId);
        }
    }

    console.log(`\n✅ OPERATION COMPLETE. Distributed ${assignedCount} leads.`);

})();
