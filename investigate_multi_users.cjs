const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = "https://vewqzsqddgmkslnuctvb.supabase.co";
const SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDUzMDQ2MiwiZXhwIjoyMDgwMTA2NDYyfQ.pAgMGN6MtKm1A3fsKr1GIt8-qmKYhwFjSt92L_6_7us";
const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

async function investigateUser(email) {
    const { data: users } = await supabase.from('users')
        .select('*')
        .eq('email', email);

    if (!users || users.length === 0) {
        console.log(`  ❌ User not found: ${email}`);
        return null;
    }

    const u = users[0];
    console.log(`  Name: ${u.name} | Email: ${u.email}`);
    console.log(`  Active: ${u.is_active} | Plan: ${u.plan_name} | Team: ${u.team_code}`);
    console.log(`  Created: ${u.created_at?.split('T')[0]}`);

    // All payments (including non-captured)
    const { data: pays } = await supabase.from('payments')
        .select('amount, plan_name, status, created_at, razorpay_payment_id')
        .eq('user_id', u.id)
        .order('created_at');

    console.log(`  Payments (${(pays || []).length} total):`);
    (pays || []).forEach((p, i) => {
        console.log(`    [${i + 1}] ₹${p.amount} ${p.plan_name} | ${p.status} | ${p.created_at?.split('T')[0]} | ${p.razorpay_payment_id}`);
    });

    // All leads
    const { count: totalLeads } = await supabase.from('leads')
        .select('*', { count: 'exact', head: true })
        .eq('assigned_to', u.id);

    // Leads by month
    const { count: janLeads } = await supabase.from('leads')
        .select('*', { count: 'exact', head: true })
        .eq('assigned_to', u.id)
        .gte('assigned_at', '2025-12-31T18:30:00Z')
        .lt('assigned_at', '2026-01-31T18:30:00Z');

    const { count: febLeads } = await supabase.from('leads')
        .select('*', { count: 'exact', head: true })
        .eq('assigned_to', u.id)
        .gte('assigned_at', '2026-01-31T18:30:00Z');

    console.log(`  Leads: Total=${totalLeads} | Jan=${janLeads || 0} | Feb=${febLeads || 0}`);

    return u;
}

async function main() {
    const lines = [];
    const log = (msg) => { console.log(msg); lines.push(msg); };

    log("=============================================================================");
    log("MULTI-USER INVESTIGATION REPORT - Feb 23, 2026");
    log("=============================================================================\n");

    // 1. Rimpy Singh
    log("📌 1. RIMPY SINGH (chouhansab64@gmail.com)");
    log("   User says: Jan 6 manual starter payment. No Feb payment.");
    await investigateUser('chouhansab64@gmail.com');
    log("");

    // 2. Balraj Singh
    log("📌 2. BALRAJ SINGH (bs0525765349@gmail.com)");
    log("   User says: Jan ₹1999 supervisor + Feb 4 ₹1999 supervisor = ₹4k total.");
    await investigateUser('bs0525765349@gmail.com');
    log("");

    // 3. Sejal
    log("📌 3. SEJAL (sejalrani72@gmail.com)");
    log("   User says: Feb 4 starter payment.");
    await investigateUser('sejalrani72@gmail.com');
    log("");

    // 4. Jashandeep singh  
    log("📌 4. JASHANDEEP SINGH (jass006623@gmail.com)");
    log("   User says: Feb 13 starter payment.");
    await investigateUser('jass006623@gmail.com');
    log("");

    // 5. Sohan Singh
    log("📌 5. SOHAN SINGH (sohanpgk22@gmail.com)");
    log("   User says: 4 payments total Jan+Feb, starter on Feb 9.");
    await investigateUser('sohanpgk22@gmail.com');
    log("");

    // 6. Rahul (ms028777@gmail.com) - needs leads reassigned
    log("📌 6. RAHUL (ms028777@gmail.com)");
    log("   Action: Leads to be reassigned.");
    await investigateUser('ms028777@gmail.com');
    log("");

    // 7. Coach Himanshu - STOP
    log("📌 7. COACH HIMANSHU (coach.himanshusharma@gmail.com)");
    log("   Action: STOPPING this account now.");
    const coachUser = await investigateUser('coach.himanshusharma@gmail.com');
    if (coachUser) {
        await supabase.from('users').update({ is_active: false }).eq('id', coachUser.id);
        log("   ✅ STOPPED!");
    }
    log("");

    // 8. NEHA GOYAL - Full History
    log("=============================================================================");
    log("📌 NEHA GOYAL (nehagoyal36526@gmail.com) - FULL HISTORY");
    log("=============================================================================");

    const { data: nehaUsers } = await supabase.from('users')
        .select('*')
        .eq('email', 'nehagoyal36526@gmail.com');

    if (nehaUsers && nehaUsers.length > 0) {
        const neha = nehaUsers[0];
        log(`  Name: ${neha.name} | Email: ${neha.email}`);
        log(`  Active: ${neha.is_active} | Plan: ${neha.plan_name}`);
        log(`  Account Created: ${neha.created_at}`);
        log(`  Team: ${neha.team_code}`);

        // Payments
        const { data: nehaPays } = await supabase.from('payments')
            .select('*').eq('user_id', neha.id);
        log(`  Payments: ${(nehaPays || []).length}`);
        (nehaPays || []).forEach(p => log(`    ₹${p.amount} ${p.plan_name} ${p.status} ${p.created_at?.split('T')[0]}`));

        // Leads with dates
        const { data: nehaLeads } = await supabase.from('leads')
            .select('id, assigned_at, created_at, source')
            .eq('assigned_to', neha.id)
            .order('assigned_at');

        log(`  Total Leads: ${(nehaLeads || []).length}`);

        // Group by date
        const byDate = {};
        (nehaLeads || []).forEach(l => {
            const d = l.assigned_at ? l.assigned_at.split('T')[0] : 'unknown';
            byDate[d] = (byDate[d] || 0) + 1;
        });
        log("  Leads by date:");
        Object.entries(byDate).forEach(([d, c]) => log(`    ${d}: ${c} leads`));

        // Find who else was activated on the same day as Neha's first lead
        const firstLeadDate = nehaLeads && nehaLeads.length > 0
            ? nehaLeads[0].assigned_at?.split('T')[0]
            : neha.created_at?.split('T')[0];

        log(`\n  First lead/activation date: ${firstLeadDate}`);
        log(`\n  --- OTHER USERS ACTIVATED ON SAME DAY (${firstLeadDate}) ---`);

        // Find users created on the same day in TEAMFIRE
        const dayStart = `${firstLeadDate}T00:00:00Z`;
        const dayEnd = `${firstLeadDate}T23:59:59Z`;

        const { data: sameDayUsers } = await supabase.from('users')
            .select('id, name, email, is_active, created_at')
            .eq('team_code', 'TEAMFIRE')
            .gte('created_at', dayStart)
            .lte('created_at', dayEnd)
            .order('name');

        // Also check users who got their first lead on that day
        const { data: allTeamfire } = await supabase.from('users')
            .select('id, name, email, is_active')
            .eq('team_code', 'TEAMFIRE');

        const activatedSameDay = [];
        for (const tu of (allTeamfire || [])) {
            const { data: firstLead } = await supabase.from('leads')
                .select('assigned_at')
                .eq('assigned_to', tu.id)
                .order('assigned_at', { ascending: true })
                .limit(1);

            if (firstLead && firstLead.length > 0) {
                const fDate = firstLead[0].assigned_at?.split('T')[0];
                if (fDate === firstLeadDate && tu.email !== 'nehagoyal36526@gmail.com') {
                    const { count } = await supabase.from('leads')
                        .select('*', { count: 'exact', head: true })
                        .eq('assigned_to', tu.id);

                    const { data: theirPays } = await supabase.from('payments')
                        .select('amount')
                        .eq('user_id', tu.id)
                        .eq('status', 'captured');

                    activatedSameDay.push({
                        name: tu.name,
                        email: tu.email,
                        active: tu.is_active ? 'ACTIVE' : 'STOPPED',
                        leads: count || 0,
                        hasPay: (theirPays || []).length > 0
                    });
                }
            }
        }

        activatedSameDay.sort((a, b) => b.leads - a.leads);
        log(`  Found ${activatedSameDay.length} other users who first received leads on ${firstLeadDate}:`);
        activatedSameDay.forEach((u, i) => {
            log(`    ${i + 1}. ${u.name} (${u.email}) [${u.active}] -> ${u.leads} leads | Payment: ${u.hasPay ? 'YES' : 'NO'}`);
        });
    } else {
        log("  ❌ nehagoyal36526@gmail.com NOT FOUND in users table!");
    }
    log("");

    // 9. Stop remaining free active users
    log("=============================================================================");
    log("📌 STOPPING REMAINING FREE ACTIVE USERS");
    log("=============================================================================");

    // Users to keep active (user mentioned they have payments):
    const KEEP_ACTIVE = [
        'bs0525765349@gmail.com',    // Balraj - has payments
        'sejalrani72@gmail.com',      // Sejal - has payment
        'jass006623@gmail.com',       // Jashandeep - has payment
    ];

    const freeActiveToStop = [
        'preetman00001@gmail.com',    // HARDEEP KAUR
        'kiran@gmail.com',            // Kiran
    ];

    for (const email of freeActiveToStop) {
        const { data } = await supabase.from('users')
            .select('id, name').eq('email', email).eq('is_active', true);
        if (data && data.length > 0) {
            await supabase.from('users').update({ is_active: false }).eq('id', data[0].id);
            log(`  ✅ STOPPED: ${data[0].name} (${email})`);
        }
    }

    log("\n=============================================================================");
    log("REPORT COMPLETE");
    log("=============================================================================");

    require('fs').writeFileSync('multi_user_investigation.txt', lines.join('\n'), 'utf8');
    log("\nSaved to multi_user_investigation.txt");
}

main().catch(console.error);
