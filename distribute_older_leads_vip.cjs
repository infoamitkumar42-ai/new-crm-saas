const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = "https://vewqzsqddgmkslnuctvb.supabase.co";
const SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDUzMDQ2MiwiZXhwIjoyMDgwMTA2NDYyfQ.pAgMGN6MtKm1A3fsKr1GIt8-qmKYhwFjSt92L_6_7us";
const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

async function main() {
    console.log("🚀 Starting distribution of Yesterday's Orphan Leads based on new plan...");

    // 1. Fetch eligible TEAMFIRE users
    const { data: teamUsers, error: tErr } = await supabase
        .from('users')
        .select('id, name, email, leads_today')
        .eq('team_code', 'TEAMFIRE')
        .eq('is_active', true)
        .eq('leads_today', 0);

    let recipients = teamUsers ? [...teamUsers] : [];

    // 2. Fetch specific user sharmahimanshu9797@gmail.com
    const { data: specificUser, error: sErr } = await supabase
        .from('users')
        .select('id, name, email, leads_today, is_active')
        .eq('email', 'sharmahimanshu9797@gmail.com');

    if (specificUser && specificUser.length > 0) {
        // Add if not already explicitly included 
        if (!recipients.find(u => u.id === specificUser[0].id)) {
            recipients.push({
                id: specificUser[0].id,
                name: specificUser[0].name,
                email: specificUser[0].email,
                leads_today: specificUser[0].leads_today || 0
            });
            console.log(`➕ Explicitly added requested user: ${specificUser[0].name} (${specificUser[0].email})`);
        }
    }

    if (recipients.length === 0) {
        console.log("❌ No eligible users found for distribution.");
        return;
    }

    console.log(`\n✅ Found ${recipients.length} Eligible Recipients:`);
    recipients.forEach(u => console.log(` - ${u.name} (${u.email})`));

    // 3. Fetch yesterday's unassigned leads
    const yesterdayStart = '2026-02-19T00:00:00.000Z';
    const yesterdayEnd = '2026-02-19T23:59:59.999Z';

    let allLeads = [];
    let hasMore = true;
    let page = 0;
    while (hasMore) {
        const { data: leads } = await supabase
            .from('leads')
            .select('id, created_at, source, assigned_to, status, name')
            .ilike('source', '%Himanshu%')
            .gte('created_at', yesterdayStart)
            .lte('created_at', yesterdayEnd)
            .range(page * 1000, (page + 1) * 1000 - 1);

        allLeads = allLeads.concat(leads || []);
        hasMore = leads && leads.length === 1000;
        page++;
    }

    const unassignedLeads = allLeads.filter(l =>
        !l.assigned_to ||
        l.assigned_to.trim() === '' ||
        l.assigned_to.toLowerCase() === 'unassigned' ||
        l.status === 'Unassigned'
    );

    console.log(`\n📥 Found ${unassignedLeads.length} Unassigned Leads from Yesterday.`);

    if (unassignedLeads.length === 0) {
        console.log("❌ No leads to assign. Exiting.");
        return;
    }

    // 4. Distribution Loop
    const now = new Date().toISOString(); // Current time on Feb 20
    const newSource = "Manual Distribution (Himanshu VIPs)"; // EXACTLY strictly this, no dates

    const assignedCounts = {};
    let userIndex = 0;

    console.log(`\n🔄 Beginning Distribution...`);

    for (let lead of unassignedLeads) {
        const user = recipients[userIndex % recipients.length];

        const updateData = {
            assigned_to: user.id,
            user_id: user.id,
            status: 'Assigned',
            created_at: now, // Pretend this lead came in RIGHT NOW 
            assigned_at: now,
            source: newSource
        };

        const { error: updErr } = await supabase
            .from('leads')
            .update(updateData)
            .eq('id', lead.id);

        if (!updErr) {
            assignedCounts[user.id] = (assignedCounts[user.id] || 0) + 1;
            user.leads_today += 1;

            // Insert Notification silently
            await supabase.from('notifications').insert({
                user_id: user.id,
                title: 'New VIP Lead Assigned',
                message: `Lead: ${lead.name || 'Unknown'} has been assigned to you.`,
                type: 'lead_assignment'
            });
            userIndex++;
        } else {
            console.error(`❌ Error updating lead ${lead.id}:`, updErr.message);
        }
    }

    console.log(`\n✅ Database Update Complete. Updating leads_today counts...`);

    // 5. Update user limits
    for (let u of recipients) {
        if (assignedCounts[u.id] > 0) {
            await supabase
                .from('users')
                .update({ leads_today: u.leads_today })
                .eq('id', u.id);
            console.log(` - Updated ${u.name}: +${assignedCounts[u.id]} leads -> Total today: ${u.leads_today}`);
        }
    }

    console.log("\n🎉 Complete!");
}
main().catch(console.error);
