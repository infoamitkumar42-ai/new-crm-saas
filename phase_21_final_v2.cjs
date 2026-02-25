const { createClient } = require('@supabase/supabase-js');
const axios = require('axios');

const SUPABASE_URL = "https://vewqzsqddgmkslnuctvb.supabase.co";
const SUPABASE_SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDUzMDQ2MiwiZXhwIjoyMDgwMTA2NDYyfQ.pAgMGN6MtKm1A3fsKr1GIt8-qmKYhwFjSt92L_6_7us";

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

const IST_OFFSET = 5.5 * 60 * 60 * 1000;
const EDGE_FUNCTION_URL = "https://vewqzsqddgmkslnuctvb.supabase.co/functions/v1/send-push-notification";

// Targeted Meta Page (User provided new token for this)
const TARGET_PAGE_ID = "1013347205188331";
const NEW_TOKEN = "EAAMp6Xu8vQ8BQpqKoE1FsmLNZAippaUPQtXwD6Qsbk02f4QZBxxHZAL9XYr55wUeoA8nfpoZBYXH2aawgXw0aQANUGUKZBX0tiz6Fz5HazAEJqMa8d0eb6CGxo8SCEUst9HOAx6Yi5S7KnNq3u47H36AF8ZAGTJv3XT2duJBAZA7nQ6C4f09tp2f51BeS1A0TREyxe4J2uE";

async function runFinalRecovery() {
    console.log("🚀 STARTING FINAL RECOVERY & CLEANUP (PHASE 21B)...");

    // 1. CLEAR NOTES for already assigned leads
    console.log("\n🧹 Clearing 'Atomic assign failed' notes...");
    const { data: leadsToClear, error: clearError } = await supabase
        .from('leads')
        .select('id')
        .eq('notes', 'Atomic assign failed');

    if (leadsToClear && leadsToClear.length > 0) {
        const { error: patchError } = await supabase
            .from('leads')
            .update({ notes: null })
            .in('id', leadsToClear.map(l => l.id));

        if (patchError) console.error("Error clearing notes:", patchError.message);
        else console.log(`✅ Cleared notes for ${leadsToClear.length} leads.`);
    }

    // 2. RECOVER leads from Meta using the NEW TOKEN
    console.log("\n📥 Fetching missing leads from Meta (New Token)...");
    const todayISTStart = new Date(new Date().setHours(0, 0, 0, 0));
    const sinceTimestamp = Math.floor((todayISTStart.getTime() - IST_OFFSET) / 1000);

    const recoveredLeads = [];
    const existingPhones = new Set();
    const { data: allLeadsToday } = await supabase.from('leads').select('phone').gte('created_at', todayISTStart.toISOString());
    allLeadsToday?.forEach(l => existingPhones.add(l.phone));

    try {
        const formsRes = await axios.get(`https://graph.facebook.com/v20.0/${TARGET_PAGE_ID}/leadgen_forms?access_token=${NEW_TOKEN}`);
        for (const form of formsRes.data.data) {
            console.log(`Checking Form: ${form.name}...`);
            const leadsRes = await axios.get(`https://graph.facebook.com/v20.0/${form.id}/leads?filtering=[{"field":"time_created","operator":"GREATER_THAN","value":${sinceTimestamp}}]&limit=100&access_token=${NEW_TOKEN}`);
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
                        source: `Meta - TFE 6444 Community (Himanshu)`,
                        status: 'Queued',
                        created_at: lead.created_time,
                        form_id: form.id,
                        notes: null // ENSURE NO NOTES
                    });
                    existingPhones.add(phone);
                }
            }
        }
        console.log(`💎 Recovered ${recoveredLeads.length} new leads from Meta using new token.`);
    } catch (e) {
        console.error("Meta Fetch Error:", e.response?.data || e.message);
    }

    if (recoveredLeads.length > 0) {
        await supabase.from('leads').insert(recoveredLeads);
    }

    // 3. ASSIGN all Queued leads for Himanshu's team
    console.log("\n⚖️ High-Speed Prioritized Assignment...");

    // Get Online & Paid members
    const { data: users } = await supabase
        .from('users')
        .select('id, name, plan_name, daily_limit, leads_today, is_online, role')
        .or('team_code.eq.TEAMFIRE,team_code.eq.GJ01TEAMFIRE')
        .eq('is_active', true)
        .eq('payment_status', 'active')
        .eq('is_online', true);

    if (!users || users.length === 0) {
        console.log("No online users.");
        return;
    }

    // Priority
    users.forEach(u => {
        const p = u.plan_name?.toLowerCase() || '';
        if (p.includes('turbo') || p.includes('boost')) u.prio = 4;
        else if (u.role === 'manager') u.prio = 3;
        else if (p.includes('supervisor')) u.prio = 2;
        else u.prio = 1;
    });

    // Get Queued leads
    const { data: queuedLeads } = await supabase
        .from('leads')
        .select('*')
        .eq('status', 'Queued')
        .or('source.ilike.%Himanshu%,source.ilike.%TFE%,source.ilike.%Skills India%');

    if (!queuedLeads || queuedLeads.length === 0) {
        console.log("No queued leads to distribute.");
    } else {
        console.log(`Total Leads to Assign: ${queuedLeads.length}`);
        let assignedCount = 0;

        users.sort((a, b) => b.prio - a.prio || a.leads_today - b.leads_today);

        for (const lead of queuedLeads) {
            const assignee = users.find(u => u.daily_limit === 0 || u.leads_today < u.daily_limit);
            if (assignee) {
                const { data: updatedLead, error: assignErr } = await supabase
                    .from('leads')
                    .update({
                        assigned_to: assignee.id,
                        user_id: assignee.id,
                        status: 'Assigned',
                        notes: null, // CLEAR ANY REMAINING NOTES
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

                    // Send Notification
                    try {
                        await axios.post(EDGE_FUNCTION_URL, {
                            type: "INSERT",
                            record: updatedLead
                        }, {
                            headers: { 'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}` }
                        });
                    } catch (pe) { }

                    users.sort((a, b) => b.prio - a.prio || a.leads_today - b.leads_today);
                }
            } else {
                console.log("All users full.");
                break;
            }
        }
        console.log(`✅ Assigned ${assignedCount} leads.`);
    }

    // 4. FINAL AUDIT
    console.log("\n📊 FINAL AUDIT FOR TEAMFIRE TODAY:");
    const { data: finalStats } = await supabase
        .from('leads')
        .select('assigned_to, created_at')
        .gte('created_at', todayISTStart.toISOString());

    const teamUserIds = users.map(u => u.id);
    const deliveredCount = finalStats.filter(l => teamUserIds.includes(l.assigned_to)).length;

    console.log(`- TOTAL LEADS DELIVERED TO TEAM TODAY: ${deliveredCount}`);
    console.log("🚀 ALL TASKS COMPLETE.");
}

runFinalRecovery();
