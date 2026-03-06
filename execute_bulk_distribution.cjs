const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const SUPABASE_URL = 'https://vewqzsqddgmkslnuctvb.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDUzMDQ2MiwiZXhwIjoyMDgwMTA2NDYyfQ.pAgMGN6MtKm1A3fsKr1GIt8-qmKYhwFjSt92L_6_7us";

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function run() {
    console.log('--- Bulk Distribution Process ---');

    // 1. Load and Parse Leads
    const rawData = fs.readFileSync('raw_leads.txt', 'utf-8');
    const lines = rawData.split('\n').filter(line => line.trim() !== '');
    const leadsToInsert = [];

    for (const line of lines) {
        const parts = line.split('\t');
        if (parts.length < 4) continue;

        const rawPhone = parts[3].trim();
        const phone = rawPhone.replace(/\D/g, '').slice(-10);
        if (phone.length !== 10) continue;

        leadsToInsert.push({
            name: parts[2].trim(),
            phone: phone,
            city: parts[4] ? parts[4].trim() : '',
            raw_data: line.trim()
        });
    }

    console.log(`Parsed ${leadsToInsert.length} valid leads.`);

    // 2. Audit Active Members
    const { data: users, error } = await supabase
        .from('users')
        .select('id, name, email, daily_limit, daily_limit_override, total_leads_promised, plan_activation_time, team_code')
        .eq('is_active', true);

    if (error) {
        console.error('User fetch error:', error);
        return;
    }

    const teamfireMembers = users.filter(u =>
        (u.team_code && u.team_code.toUpperCase().includes('TEAMFIRE')) ||
        (u.name && u.name.toUpperCase().includes('TEAMFIRE'))
    );

    console.log(`Found ${teamfireMembers.length} active TeamFire members.`);

    const userStats = [];
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    for (const user of teamfireMembers) {
        const activationDate = user.plan_activation_time ? new Date(user.plan_activation_time) : new Date('2026-02-01');

        // Count total received since activation
        const { count: receivedCount } = await supabase
            .from('leads')
            .select('*', { count: 'exact', head: true })
            .eq('assigned_to', user.id)
            .gte('assigned_at', activationDate.toISOString());

        // Count received TODAY
        const { count: todayCount } = await supabase
            .from('leads')
            .select('*', { count: 'exact', head: true })
            .eq('assigned_to', user.id)
            .gte('assigned_at', todayStart.toISOString());

        const limit = user.daily_limit_override || user.daily_limit || 0;
        const promised = user.total_leads_promised || 0;
        const received = receivedCount || 0;
        const pending = Math.max(0, promised - received);
        const dailyRemaining = Math.max(0, limit - (todayCount || 0));

        userStats.push({
            id: user.id,
            name: user.name,
            email: user.email,
            limit,
            todayCount: todayCount || 0,
            dailyRemaining,
            promised,
            received,
            pending
        });
    }

    // Sort by pending DESC, then dailyRemaining DESC
    userStats.sort((a, b) => b.pending - a.pending || b.dailyRemaining - a.dailyRemaining);

    // 3. Distribution Map
    const distributionMap = []; // { lead: leadObj, memberId: memberId }
    let currentLeadIdx = 0;

    // Fill pending quotas first
    console.log('Distributing based on pending quotas and daily limits...');

    // We do rounds
    while (currentLeadIdx < leadsToInsert.length) {
        let leadsAssignedInThisRound = 0;

        for (const member of userStats) {
            if (currentLeadIdx >= leadsToInsert.length) break;

            // Check if member can take more (daily limit)
            if (member.dailyRemaining > 0) {
                const lead = leadsToInsert[currentLeadIdx];
                distributionMap.push({
                    lead,
                    memberId: member.id,
                    memberName: member.name
                });
                member.dailyRemaining--;
                member.received++;
                member.pending = Math.max(0, member.pending - 1);
                currentLeadIdx++;
                leadsAssignedInThisRound++;
            }
        }

        if (leadsAssignedInThisRound === 0) {
            console.log('All members hit their daily limits or no members can take more leads.');
            break;
        }
    }

    console.log(`Planned distribution for ${distributionMap.length} leads.`);

    // 4. Batch Insertion
    const insertData = distributionMap.map(item => ({
        name: item.lead.name,
        phone: item.lead.phone,
        city: item.lead.city,
        source: 'Bulk-Teamfire-Feb27',
        status: 'Assigned',
        assigned_to: item.memberId,
        user_id: item.memberId,
        assigned_at: new Date().toISOString()
    }));

    // Insert in batches of 50 to be safe
    const batchSize = 50;
    for (let i = 0; i < insertData.length; i += batchSize) {
        const batch = insertData.slice(i, i + batchSize);
        const { error: insErr } = await supabase.from('leads').insert(batch);
        if (insErr) {
            console.error(`Batch ${i / batchSize} insert error:`, insErr);
        } else {
            console.log(`✅ Batch ${i / batchSize + 1} inserted (${batch.length} leads).`);
        }
    }

    if (currentLeadIdx < leadsToInsert.length) {
        console.log(`⚠️ ${leadsToInsert.length - currentLeadIdx} leads remaining because everyone hit their limits.`);
    }

    console.log('--- DISTRIBUTION SUMMARY ---');
    const summary = {};
    distributionMap.forEach(item => {
        summary[item.memberName] = (summary[item.memberName] || 0) + 1;
    });
    console.log(summary);
}

run();
