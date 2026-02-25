const { createClient } = require('@supabase/supabase-js');
const axios = require('axios');

const SUPABASE_URL = "https://vewqzsqddgmkslnuctvb.supabase.co";
const SUPABASE_SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDUzMDQ2MiwiZXhwIjoyMDgwMTA2NDYyfQ.pAgMGN6MtKm1A3fsKr1GIt8-qmKYhwFjSt92L_6_7us";

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

// Config
const IST_OFFSET = 5.5 * 60 * 60 * 1000;
const EDGE_FUNCTION_URL = "https://vewqzsqddgmkslnuctvb.supabase.co/functions/v1/send-push-notification";

async function runDefinitiveRecovery() {
    console.log("🚀 STARTING DEFINITIVE RECOVERY & CLEANUP (PHASE 21)...");

    // 1. CLEANUP: Mark STRICTLY underage leads as Invalid (Age < 18)
    console.log("\n🧹 Cleaning up underage leads (Age < 18)...");
    const { data: underageLeads } = await supabase
        .from('leads')
        .select('id, name, notes')
        .or('notes.ilike.%17%,notes.ilike.%16%,notes.ilike.%15%,notes.ilike.%under 18%,notes.ilike.%minor%')
        .not('status', 'in', '("Invalid","Rejected","Duplicate")');

    // Filter to be sure it's not "18"
    const strictlyUnderage = underageLeads?.filter(l => {
        const n = l.notes?.toLowerCase() || '';
        // If it says "18", don't mark as invalid unless it says "under 18" or "below 18"
        if (n.includes('18')) {
            return n.includes('under 18') || n.includes('below 18') || n.includes('minor');
        }
        return true; // 17, 16, etc. covered by ilike
    }) || [];

    if (strictlyUnderage.length > 0) {
        console.log(`Marking ${strictlyUnderage.length} leads as Invalid...`);
        await supabase.from('leads').update({ status: 'Invalid' }).in('id', strictlyUnderage.map(l => l.id));
        console.log("✅ Cleanup done.");
    } else {
        console.log("No strictly underage leads found.");
    }

    // 2. RECOVERY: Fetch leads from Meta
    console.log("\n📥 Fetching leads from Meta Graph API...");
    const { data: pages } = await supabase
        .from('meta_pages')
        .select('page_id, page_name, access_token')
        .or(`team_id.eq.TEAMFIRE,team_id.eq.GJ01TEAMFIRE`);

    if (!pages) return;

    const todayISTStart = new Date(new Date().setHours(0, 0, 0, 0));
    const sinceTimestamp = Math.floor((todayISTStart.getTime() - IST_OFFSET) / 1000);

    const recoveredLeads = [];
    const existingPhones = new Set();
    const { data: existingLeads } = await supabase.from('leads').select('phone').gte('created_at', todayISTStart.toISOString());
    existingLeads?.forEach(l => existingPhones.add(l.phone));

    for (const page of pages) {
        console.log(`Checking ${page.page_name}...`);
        try {
            const formsRes = await axios.get(`https://graph.facebook.com/v20.0/${page.page_id}/leadgen_forms?access_token=${page.access_token}`);
            for (const form of formsRes.data.data) {
                const leadsRes = await axios.get(`https://graph.facebook.com/v20.0/${form.id}/leads?filtering=[{"field":"time_created","operator":"GREATER_THAN","value":${sinceTimestamp}}]&access_token=${page.access_token}`);
                for (const lead of leadsRes.data.data) {
                    const phoneField = lead.field_data.find(f => f.name === 'phone_number' || f.name === 'phone');
                    const nameField = lead.field_data.find(f => f.name === 'full_name' || f.name === 'name');
                    const cityField = lead.field_data.find(f => f.name === 'city');

                    const rawPhone = phoneField ? phoneField.values[0] : null;
                    const phone = rawPhone ? rawPhone.replace(/\D/g, '').slice(-10) : null;
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
                            form_id: form.id
                            // No custom notes as requested
                        });
                        existingPhones.add(phone);
                    }
                }
            }
        } catch (e) {
            console.error(`Page ${page.page_name} error:`, e.message);
        }
    }

    console.log(`💎 Recovered ${recoveredLeads.length} new leads from Meta.`);

    if (recoveredLeads.length > 0) {
        const { error: insErr } = await supabase.from('leads').insert(recoveredLeads);
        if (insErr) console.error("Insert error:", insErr);
    }

    // 3. ASSIGNMENT: Prioritized Assignment with Notifications
    console.log("\n⚖️ Starting Prioritized Assignment...");

    // A. Online & Paid Members
    const { data: users } = await supabase
        .from('users')
        .select('id, name, plan_name, daily_limit, leads_today, is_online, role')
        .or('team_code.eq.TEAMFIRE,team_code.eq.GJ01TEAMFIRE')
        .eq('is_active', true)
        .eq('payment_status', 'active')
        .eq('is_online', true);

    if (!users || users.length === 0) {
        console.log("No online members.");
        return;
    }

    // Priority Map
    users.forEach(u => {
        const p = u.plan_name?.toLowerCase() || '';
        if (p.includes('turbo') || p.includes('boost')) u.prio = 4;
        else if (u.role === 'manager') u.prio = 3;
        else if (p.includes('supervisor')) u.prio = 2;
        else u.prio = 1;
    });

    // B. Get all Queued leads for Himanshu's team
    const { data: queuedLeads } = await supabase
        .from('leads')
        .select('*')
        .eq('status', 'Queued')
        .or('source.ilike.%Himanshu%,source.ilike.%TFE%,source.ilike.%Skills India%');

    if (!queuedLeads || queuedLeads.length === 0) {
        console.log("No queued leads to assign.");
        return;
    }

    console.log(`Total Leads to Assign: ${queuedLeads.length}`);

    // C. Sort users: Prio (high) -> Leads Today (low)
    users.sort((a, b) => b.prio - a.prio || a.leads_today - b.leads_today);

    let assignedCount = 0;
    for (const lead of queuedLeads) {
        const assignee = users.find(u => u.daily_limit === 0 || u.leads_today < u.daily_limit);
        if (assignee) {
            // Verify lead is still Queued (Atomic)
            const { data: updatedLead, error: assignErr } = await supabase
                .from('leads')
                .update({
                    assigned_to: assignee.id,
                    user_id: assignee.id,
                    status: 'Assigned',
                    assigned_at: new Date().toISOString(),
                    distributed_at: new Date().toISOString()
                })
                .eq('id', lead.id)
                .eq('status', 'Queued')
                .select()
                .single();

            if (!assignErr && updatedLead) {
                assignee.leads_today++;
                assignedCount++;
                console.log(`[${assignedCount}] Assigned ${lead.name} -> ${assignee.name}`);

                // Send Push Notification
                try {
                    await axios.post(EDGE_FUNCTION_URL, {
                        type: "INSERT",
                        record: updatedLead
                    }, {
                        headers: { 'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}` }
                    });
                } catch (pe) {
                    console.error(`Push Error for ${assignee.name}:`, pe.message);
                }

                // Re-sort
                users.sort((a, b) => b.prio - a.prio || a.leads_today - b.leads_today);
            }
        } else {
            console.log("All users full.");
            break;
        }
    }

    console.log(`\n🎉 DONE! Assigned ${assignedCount} leads with notifications.`);
}

runDefinitiveRecovery();
