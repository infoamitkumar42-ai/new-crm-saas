import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://vewqzsqddgmkslnuctvb.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDUzMDQ2MiwiZXhwIjoyMDgwMTA2NDYyfQ.pAgMGN6MtKm1A3fsKr1GIt8-qmKYhwFjSt92L_6_7us';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function distributeLeads() {
    console.log('🚀 --- DISTRIBUTING JAN 17 ORPHAN LEADS ---\n');

    // 1. Fetch Jan 17 Orphans (UTC)
    // Jan 17 starts at 2026-01-17T00:00:00Z and ends before 2026-01-18T00:00:00Z
    const { data: leads, error: leadError } = await supabase
        .from('leads')
        .select('id, name, phone, created_at')
        .is('user_id', null)
        .gte('created_at', '2026-01-17T00:00:00.000Z')
        .lt('created_at', '2026-01-18T00:00:00.000Z')
        .order('created_at', { ascending: true });

    if (leadError) { console.error('❌ Lead fetch error:', leadError); return; }

    console.log(`📦 Found ${leads.length} Orphan Leads from Jan 17.`);

    if (leads.length === 0) {
        console.log('✅ No orphans to distribute.');
        return;
    }

    // 2. Fetch Active Users
    const { data: users, error: userError } = await supabase
        .from('users')
        .select('id, name, leads_today')
        .eq('is_active', true)
        .not('plan_name', 'eq', 'none')
        .order('name'); // Consistent order

    if (userError) { console.error('❌ User fetch error:', userError); return; }

    // Filter valid (expiration check optional but good)
    const now = new Date();
    // Assuming simple active check is enough as per previous instructions "active users"

    console.log(`👥 Found ${users.length} Active Users for distribution.`);

    if (users.length === 0) {
        console.error('❌ No active users found!');
        return;
    }

    // 3. Distribution Loop (Round Robin)
    let distributedCount = 0;

    for (let i = 0; i < leads.length; i++) {
        const lead = leads[i];
        const user = users[i % users.length];

        // Assign
        const { error: updateError } = await supabase
            .from('leads')
            .update({
                user_id: user.id,
                assigned_to: user.id,
                status: 'Assigned',
                assigned_at: new Date().toISOString()
            })
            .eq('id', lead.id);

        if (updateError) {
            console.error(`❌ Failed to assign ${lead.name}:`, updateError.message);
        } else {
            console.log(`✅ Assigned ${lead.name} (${lead.phone}) -> ${user.name}`);
            distributedCount++;

            // Increment local counter just for log (not updating DB user count here to save time/calls, or should we? User said "equally", usually leads_today tracks daily limit, but since this is backlog/bulk, we might just fill them up)
            // Ideally we should update leads_today if it counts towards today's limit.
            // But usually bulk dumps are "extra". I'll update leads_today to be safe/accurate.

            await supabase.rpc('increment_leads_today', { user_id: user.id });
        }
    }

    console.log(`\n🎉 Distribution Complete: ${distributedCount}/${leads.length} Leads assigned.`);
}

distributeLeads();
