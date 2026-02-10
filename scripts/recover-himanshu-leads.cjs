const { createClient } = require('@supabase/supabase-js');
const axios = require('axios');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

const PAGE_ID = '299210096616852';
const TEAM_ID = 'TEAMFIRE';
const ACCESS_TOKEN = 'EAAMp6Xu8vQ8BQlncy3peZCgZAsZAt9lZAkGVh99IUZBgXq0mSsDaVufuJoAbzfgazv4ZARcwLLGLO2Fy40jJaMiAQx3c9p6pMCzeEqGU7gVxKkpI5ZByfcrt9xHbFE6pQ6FLDdh2axE3Cx8SofbD42ubLAD4SSzvNLAF2PWuxie66bhxyyHp0bCMYT7GwKBEHzF5xAg';

async function recoverHimanshuLeads() {
    console.log(`--- Fetching Leads for Himanshu Page: ${PAGE_ID} ---`);

    // 1. Get Leads from Meta (Iterate through discovered forms)
    const formIds = ['2042478153195290', '1487798195872694', '833392899334397'];
    const today = new Date().toISOString().split('T')[0];
    let todaysLeads = [];

    for (const formId of formIds) {
        console.log(`Fetching leads for Form: ${formId}`);
        const url = `https://graph.facebook.com/v21.0/${formId}/leads?access_token=${ACCESS_TOKEN}&limit=500`;
        const response = await axios.get(url).catch(e => {
            console.error(`Error for form ${formId}:`, e.response?.data || e.message);
            return null;
        });

        if (response && response.data?.data) {
            const formLeads = response.data.data.filter(l => l.created_time.startsWith(today));
            console.log(`- Found ${formLeads.length} leads for form ${formId}`);
            todaysLeads.push(...formLeads);
        }
    }

    console.log(`Total Leads from Today Across All Forms: ${todaysLeads.length}`);

    // 2. Fetch Eligible Team Members (0 leads today, paid, active)
    console.log(`Fetching eligible members for team: ${TEAM_ID} (0 leads today)`);
    const { data: teamUsers } = await supabase
        .from('users')
        .select('id, name, leads_today')
        .eq('team_code', TEAM_ID)
        .eq('is_active', true)
        .eq('payment_status', 'active')
        .eq('leads_today', 0);

    if (!teamUsers || teamUsers.length === 0) {
        console.log('No members with 0 leads. Relaxing criteria to just active paid members.');
        const { data: allActive } = await supabase
            .from('users')
            .select('id, name, leads_today')
            .eq('team_code', TEAM_ID)
            .eq('is_active', true)
            .eq('payment_status', 'active');
        teamUsers.push(...(allActive || []));
    }

    if (!teamUsers || teamUsers.length === 0) {
        console.error('No active users found for team.');
        return;
    }

    console.log(`Total Eligible Users: ${teamUsers.length}`);

    // Sort by leads_today (if relaxed)
    teamUsers.sort((a, b) => (a.leads_today || 0) - (b.leads_today || 0));

    // 3. Process and Insert
    let recoveredCount = 0;
    let assignedCount = 0;
    let userIdx = 0;

    for (const lead of todaysLeads) {
        // Extract fields
        const fields = {};
        lead.field_data.forEach(f => {
            fields[f.name] = f.values?.[0] || '';
        });

        const name = fields.full_name || fields.name || 'Unknown';
        const city = fields.city || '';
        let rawPhone = fields.phone_number || fields.phoneNumber || fields.mobile || '';
        const phone = (rawPhone || '').replace(/\D/g, '').slice(-10);

        if (!phone || phone.length < 10) continue;

        // Check for duplicate in DB
        const { data: existing } = await supabase
            .from('leads')
            .select('id')
            .eq('phone', phone)
            .limit(1);

        if (existing && existing.length > 0) {
            console.log(`Skipping duplicate: ${phone}`);
            continue;
        }

        // Round Robin Assignment
        let targetUser = teamUsers[userIdx % teamUsers.length];
        userIdx++;

        const { error: insErr } = await supabase.from('leads').insert({
            name,
            phone,
            city,
            source: `Meta - Digital Skills India (Himanshu Recovered)`,
            status: 'Assigned',
            assigned_to: targetUser.id,
            user_id: targetUser.id,
            form_id: lead.form_id,
            created_at: lead.created_time,
            assigned_at: new Date().toISOString()
        });

        if (!insErr) {
            recoveredCount++;
            assignedCount++;

            // Sync user counter
            const newCount = (targetUser.leads_today || 0) + 1;
            targetUser.leads_today = newCount;
            await supabase.from('users').update({ leads_today: newCount }).eq('id', targetUser.id);
            console.log(`✅ Assigned ${name} to ${targetUser.name}`);
        } else {
            console.error(`Error inserting lead: ${insErr.message}`);
        }
    }

    console.log(`Successfully recovered ${recoveredCount} leads. Assigned ${assignedCount} to ${TEAM_ID}.`);
}

recoverHimanshuLeads();
