const { createClient } = require('@supabase/supabase-js');
const axios = require('axios');

const SUPABASE_URL = "https://vewqzsqddgmkslnuctvb.supabase.co";
const SUPABASE_SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDUzMDQ2MiwiZXhwIjoyMDgwMTA2NDYyfQ.pAgMGN6MtKm1A3fsKr1GIt8-qmKYhwFjSt92L_6_7us";

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

// Config
const TEAM_CODES = ['TEAMFIRE', 'GJ01TEAMFIRE'];
const IST_OFFSET = 5.5 * 60 * 60 * 1000;
const TIER_PRIORITY = {
    'turbo': 4,
    'boost': 4,
    'manager': 3,
    'supervisor': 2,
    'starter': 1
};

async function runRecovery() {
    console.log("🚀 STARTING PHASE 21: RECOVERY & CLEANUP...");

    // 1. CLEANUP: Mark underage leads as Invalid
    console.log("\n🧹 Cleaning up underage leads...");
    const { data: underageLeads, error: uError } = await supabase
        .from('leads')
        .select('id, name, notes')
        .or('notes.ilike.%age%,notes.ilike.%minor%')
        .not('status', 'in', '("Invalid","Rejected","Duplicate")');

    if (underageLeads && underageLeads.length > 0) {
        console.log(`Found ${underageLeads.length} leads with "age/minor" notes. Moving to Invalid...`);
        const { error: patchError } = await supabase
            .from('leads')
            .update({ status: 'Invalid' })
            .in('id', underageLeads.map(l => l.id));
        if (patchError) console.error("Error marking underage:", patchError);
        else console.log(`✅ Marked ${underageLeads.length} leads as Invalid.`);
    } else {
        console.log("No new underage leads found to cleanup.");
    }

    // 2. RECOVERY: Fetch leads from Meta
    console.log("\n📥 Fetching leads from Meta Graph API...");
    const { data: pages } = await supabase
        .from('meta_pages')
        .select('page_id, page_name, access_token')
        .or(`team_id.eq.TEAMFIRE,team_id.eq.GJ01TEAMFIRE`);

    if (!pages) return;

    // Get today's start in UTC for Meta (approx 00:00 IST)
    const todayIST = new Date(new Date().setHours(0, 0, 0, 0));
    const sinceTimestamp = Math.floor((todayIST.getTime() - IST_OFFSET) / 1000);

    const recoveredLeads = [];
    const existingPhones = new Set();

    // Get existing phones from DB for today to avoid duplicates
    const { data: existingLeads } = await supabase.from('leads').select('phone').gte('created_at', todayIST.toISOString());
    existingLeads?.forEach(l => existingPhones.add(l.phone));

    for (const page of pages) {
        console.log(`Checking page: ${page.page_name}...`);
        try {
            // A. Get Lead Forms for this page
            const formsRes = await axios.get(`https://graph.facebook.com/v20.0/${page.page_id}/leadgen_forms?access_token=${page.token}`);
            const forms = formsRes.data.data;

            for (const form of forms) {
                // B. Get Leads for this form
                const leadsRes = await axios.get(`https://graph.facebook.com/v20.0/${form.id}/leads?filtering=[{"field":"time_created","operator":"GREATER_THAN","value":${sinceTimestamp}}]&access_token=${page.token}`);
                const leads = leadsRes.data.data;

                for (const lead of leads) {
                    const phoneField = lead.field_data.find(f => f.name === 'phone_number' || f.name === 'phone');
                    const nameField = lead.field_data.find(f => f.name === 'full_name' || f.name === 'name');
                    const cityField = lead.field_data.find(f => f.name === 'city');

                    const phone = phoneField ? phoneField.values[0].replace(/\D/g, '').slice(-10) : null;
                    const name = nameField ? nameField.values[0] : 'N/A';
                    const city = cityField ? cityField.values[0] : 'N/A';

                    if (phone && !existingPhones.has(phone)) {
                        recoveredLeads.push({
                            name,
                            phone,
                            city,
                            source: `Meta - ${page.page_name}`,
                            status: 'Queued',
                            created_at: lead.created_time,
                            form_id: form.id,
                            notes: 'Recovered via Phase 21 Script'
                        });
                        existingPhones.add(phone);
                    }
                }
            }
        } catch (err) {
            console.error(`Error fetching from ${page.page_name}:`, err.response?.data || err.message);
        }
    }

    console.log(`\n💎 Total Recovered (New) Leads: ${recoveredLeads.length}`);

    if (recoveredLeads.length > 0) {
        // Insert recovered leads
        const { error: insError } = await supabase.from('leads').insert(recoveredLeads);
        if (insError) {
            console.error("Error inserting recovered leads:", insError);
            return;
        }
    }

    // 3. ASSIGNMENT: Prioritized Assignment
    console.log("\n⚖️ Starting Prioritized Assignment...");

    // A. Get Online & Paid Members
    const { data: users } = await supabase
        .from('users')
        .select('id, name, plan_name, daily_limit, leads_today, is_online, is_active, payment_status, role')
        .or('team_code.eq.TEAMFIRE,team_code.eq.GJ01TEAMFIRE')
        .eq('is_active', true)
        .eq('payment_status', 'active')
        .eq('is_online', true);

    if (!users || users.length === 0) {
        console.log("No online members found to assign leads.");
        return;
    }

    // B. Calculate Priority Tier for each user
    users.forEach(u => {
        const plan = u.plan_name?.toLowerCase() || '';
        let score = 1; // Default
        if (plan.includes('turbo') || plan.includes('boost')) score = 4;
        else if (u.role === 'manager') score = 3;
        else if (plan.includes('supervisor')) score = 2;
        u.priority_score = score;
    });

    // C. Get ALL Queued leads for these pages
    const { data: queuedLeads } = await supabase
        .from('leads')
        .select('id, name, source')
        .eq('status', 'Queued')
        .or('source.ilike.%Himanshu%,source.ilike.%TFE%,source.ilike.%Chirag%,source.ilike.%Bhumit%');

    if (!queuedLeads || queuedLeads.length === 0) {
        console.log("No queued leads found to assign.");
        return;
    }

    console.log(`Total Leads to Assign: ${queuedLeads.length}`);

    // D. Assignment Loop (Tiered Round Robin)
    // Sort users by priority score (desc) and current leads (asc)
    users.sort((a, b) => b.priority_score - a.priority_score || a.leads_today - b.leads_today);

    let assignedCount = 0;
    for (const lead of queuedLeads) {
        // Find next eligible user who hasn't hit daily limit
        const assignee = users.find(u => u.daily_limit === 0 || u.leads_today < u.daily_limit);

        if (assignee) {
            const { error: assignError } = await supabase
                .from('leads')
                .update({
                    assigned_to: assignee.id,
                    status: 'Assigned',
                    assigned_at: new Date().toISOString(),
                    distributed_at: new Date().toISOString()
                })
                .eq('id', lead.id);

            if (!assignError) {
                assignee.leads_today++;
                assignedCount++;
                // Re-sort users to maintain fairness within tiers
                users.sort((a, b) => b.priority_score - a.priority_score || a.leads_today - b.leads_today);
            }
        } else {
            console.log("⚠️ All online users have reached their daily limit!");
            break;
        }
    }

    console.log(`\n🎉 Phase 21 Complete! Assigned ${assignedCount} leads to team.`);
}

runRecovery();
