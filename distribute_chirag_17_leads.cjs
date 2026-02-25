const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const SUPABASE_URL = "https://vewqzsqddgmkslnuctvb.supabase.co";
const SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDUzMDQ2MiwiZXhwIjoyMDgwMTA2NDYyfQ.pAgMGN6MtKm1A3fsKr1GIt8-qmKYhwFjSt92L_6_7us";
const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

async function main() {
    // 1. Read the 17 leads
    if (!fs.existsSync('chirag_17_leads.json')) {
        console.error("No chirag_17_leads.json file found!");
        return;
    }
    const chiragLeads = JSON.parse(fs.readFileSync('chirag_17_leads.json', 'utf8'));
    console.log(`Loaded ${chiragLeads.length} leads to distribute.`);

    // 2. Fetch active managers and supervisors in GJ01TEAMFIRE
    const TEAM_CODE = 'GJ01TEAMFIRE';
    const { data: teamUsers, error: tErr } = await supabase
        .from('users')
        .select('id, name, email, plan_name, leads_today')
        .eq('team_code', TEAM_CODE)
        .eq('is_active', true)
        .in('plan_name', ['manager', 'supervisor']);

    if (tErr) {
        console.error("Error fetching team users:", tErr.message);
        return;
    }

    // Filter out Chirag himself from receiving these if he was returned
    const recipients = teamUsers.filter(u => !u.name.toLowerCase().includes('chirag'));

    console.log(`Found ${recipients.length} Manager/Supervisor recipients in ${TEAM_CODE}:`);
    recipients.forEach(u => console.log(` - ${u.name} (${u.plan_name})`));

    if (recipients.length === 0) {
        console.error("No active managers/supervisors found!");
        return;
    }

    // 3. Distribute the leads equally
    const now = new Date().toISOString();
    let index = 0;

    // keep track of changes for local notification / incrementing local limits
    const assignedCounts = {};

    for (let lead of chiragLeads) {
        const user = recipients[index % recipients.length];

        // Update lead in Supabase
        // Changing created_at / assigned_at to make it look fresh
        const updateData = {
            assigned_to: user.id,
            user_id: user.id,
            status: 'Assigned', // Ensuring it's set to assigned
            created_at: now,
            assigned_at: now,
            source: lead.source + ' (Reassigned)' // small note, but user said keep it fresh. I'll just keep the original source to make it look completely organic? User said "aisa lage aaj ki hai".
        };

        // Let's actually keep original source entirely so it looks fresh from FB/IG
        const organicUpdateData = {
            assigned_to: user.id,
            user_id: user.id,
            status: 'Assigned',
            created_at: now,
            assigned_at: now
        };

        const { error: updErr } = await supabase
            .from('leads')
            .update(organicUpdateData)
            .eq('id', lead.id);

        if (updErr) {
            console.error(`Error updating lead ${lead.id}:`, updErr.message);
            continue;
        }

        console.log(`✅ Assigned lead ${lead.name} to ${user.name}`);

        // Insert Notification
        await supabase.from('notifications').insert({
            user_id: user.id,
            title: 'New Lead Assigned',
            message: `Lead: ${lead.name} has been assigned to you.`,
            type: 'lead_assignment'
        });

        // Track how many we give everyone
        assignedCounts[user.id] = (assignedCounts[user.id] || 0) + 1;
        user.leads_today += 1;

        index++;
    }

    // 4. Update leads_today for the users we assigned leads to
    for (let u of recipients) {
        if (assignedCounts[u.id] > 0) {
            await supabase
                .from('users')
                .update({ leads_today: u.leads_today })
                .eq('id', u.id);
            console.log(`Updated leads_today for ${u.name}: +${assignedCounts[u.id]} -> new total: ${u.leads_today}`);
        }
    }

    console.log("Distribution Complete!");
}

main().catch(console.error);
