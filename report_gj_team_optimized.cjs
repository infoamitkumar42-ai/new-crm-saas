const { createClient } = require('@supabase/supabase-js');
const supabase = createClient('https://vewqzsqddgmkslnuctvb.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDUzMDQ2MiwiZXhwIjoyMDgwMTA2NDYyfQ.pAgMGN6MtKm1A3fsKr1GIt8-qmKYhwFjSt92L_6_7us');

function getPlan(amt, hint) {
    amt = Number(amt);
    if (amt === 999) return { p: 'starter', l: 55 };
    if (amt === 1999) return (hint || '').toLowerCase().includes('weekly') || (hint || '').toLowerCase().includes('boost') ? { p: 'weekly', l: 92 } : { p: 'supervisor', l: 115 };
    if (amt === 2999) return { p: 'manager', l: 176 };
    if (amt === 2499) return { p: 'turbo', l: 108 };
    return { p: 'unknown', l: 0 };
}

async function main() {
    try {
        console.log("Fetching users...");
        const { data: allUsers, error: uErr } = await supabase.from('users')
            .select('id, name, email, is_active')
            .eq('team_code', 'GJ01TEAMFIRE')
            .order('name');

        if (uErr) { console.error("User Error:", uErr); return; }
        const userIds = allUsers.map(u => u.id);

        console.log("Fetching payments...");
        const { data: allPays, error: pErr } = await supabase.from('payments')
            .select('user_id, amount, plan_name, razorpay_payment_id')
            .in('user_id', userIds)
            .eq('status', 'captured');

        if (pErr) { console.error("Payment Error:", pErr); return; }

        console.log("Fetching assigned lead counts...");
        // Since we can't easily do a group by count in simple supabase JS, we will fetch lead ids
        const { data: allLeads, error: lErr } = await supabase.from('leads')
            .select('assigned_to')
            .in('assigned_to', userIds);

        if (lErr) { console.error("Lead Error:", lErr); return; }

        // Aggregate leads per user
        const leadCounts = {};
        for (let l of allLeads) {
            leadCounts[l.assigned_to] = (leadCounts[l.assigned_to] || 0) + 1;
        }

        let totalPromised = 0;
        let totalDelivered = 0;
        let totalPending = 0;

        const fulfilledUsers = [];
        const pendingUsers = [];

        for (const u of allUsers) {
            const pays = allPays.filter(p => p.user_id === u.id);
            if (pays.length === 0) continue;

            const seen = new Set();
            let userPromised = 0;

            for (const p of pays) {
                const rp = p.razorpay_payment_id || Math.random();
                if (seen.has(rp)) continue;
                seen.add(rp);
                userPromised += getPlan(p.amount, p.plan_name).l;
            }

            const d = leadCounts[u.id] || 0;
            const pending = Math.max(0, userPromised - d);

            if (userPromised > 0) {
                totalPromised += userPromised;
                totalDelivered += d;
                totalPending += pending;

                const userInfo = { name: u.name, act: u.is_active ? 'ACTIVE' : 'STOPPED', promised: userPromised, delivered: d, pending: pending };

                if (pending === 0 || d >= userPromised) {
                    fulfilledUsers.push({ ...userInfo, overrun: d - userPromised });
                } else {
                    pendingUsers.push(userInfo);
                }
            }
        }

        console.log('\\n=== GJ01TEAMFIRE LEAD AUDIT AFTER BULK ASSIGNMENT ===\\n');

        console.log('[USERS WHOSE QUOTA IS NOW FULL / COMPLETE]');
        if (fulfilledUsers.length === 0) console.log('  (None)');
        fulfilledUsers.forEach(u => {
            let msg = '  ✅ ' + u.name + ' [' + u.act + '] (Promised: ' + u.promised + ', Delivered: ' + u.delivered + ')';
            if (u.overrun > 0) msg += ' [⭐ OVER by ' + u.overrun + ']';
            console.log(msg);
        });

        console.log('\\n[USERS WHO STILL NEED PENDING LEADS]');
        if (pendingUsers.length === 0) console.log('  (None)');
        pendingUsers.sort((a, b) => b.pending - a.pending).forEach(u => {
            console.log('  ⏳ ' + u.name + ' [' + u.act + '] -> Needs ' + u.pending + ' more (Promised: ' + u.promised + ', Delivered: ' + u.delivered + ')');
        });

        console.log('\\n=== FINAL SUMMARY ===');
        console.log('Total Paid Users (Active + Stopped): ' + (fulfilledUsers.length + pendingUsers.length));
        console.log('Total Promised Leads overall: ' + totalPromised);
        console.log('Total Delivered Leads overall: ' + totalDelivered);
        console.log('TOTAL PENDING LEADS REQUIRED TO FULLY SATISFY THIS TEAM: ' + totalPending);

    } catch (err) {
        console.error("Fatal Error:", err);
    }
}

main();
