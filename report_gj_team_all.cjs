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
    // Note: Removed the is_active=true filter because the trigger might have deactivated them.
    const { data: allUsers } = await supabase.from('users')
        .select('id, name, email, is_active')
        .eq('team_code', 'GJ01TEAMFIRE')
        .order('name');

    let totalPromised = 0;
    let totalDelivered = 0;
    let totalPending = 0;

    const fulfilledUsers = [];
    const pendingUsers = [];

    for (const u of (allUsers || [])) {
        let { data: pays } = await supabase.from('payments')
            .select('amount, plan_name, razorpay_payment_id')
            .eq('user_id', u.id)
            .eq('status', 'captured');

        if (!pays || pays.length === 0) continue;

        const seen = new Set();
        let userPromised = 0;

        for (const p of pays) {
            const rp = p.razorpay_payment_id || Math.random();
            if (seen.has(rp)) continue;
            seen.add(rp);
            userPromised += getPlan(p.amount, p.plan_name).l;
        }

        const { count: delivered } = await supabase.from('leads')
            .select('*', { count: 'exact', head: true })
            .eq('assigned_to', u.id);

        const d = delivered || 0;
        const pending = Math.max(0, userPromised - d);

        // Include them in the report if they have any promised leads
        if (userPromised > 0) {
            totalPromised += userPromised;
            totalDelivered += d;
            totalPending += pending;

            const userInfo = { name: u.name, is_active: u.is_active, promised: userPromised, delivered: d, pending: pending };

            if (pending === 0 || d >= userPromised) {
                fulfilledUsers.push({ ...userInfo, overrun: d - userPromised });
            } else {
                pendingUsers.push(userInfo);
            }
        }
    }

    console.log('=== GJ01TEAMFIRE LEAD AUDIT AFTER BULK ASSIGNMENT ===\\n');

    console.log('[USERS WHOSE QUOTA IS NOW FULL / COMPLETE]');
    if (fulfilledUsers.length === 0) console.log('  (None)');
    fulfilledUsers.forEach(u => {
        let act = u.is_active ? 'ACTIVE' : 'STOPPED';
        let msg = '  ✅ ' + u.name + ' [' + act + '] (Promised: ' + u.promised + ', Delivered: ' + u.delivered + ')';
        if (u.overrun > 0) msg += ' [⭐ OVER by ' + u.overrun + ']';
        console.log(msg);
    });

    console.log('\\n[USERS WHO STILL NEED PENDING LEADS]');
    if (pendingUsers.length === 0) console.log('  (None)');
    pendingUsers.sort((a, b) => b.pending - a.pending).forEach(u => {
        let act = u.is_active ? 'ACTIVE' : 'STOPPED';
        console.log('  ⏳ ' + u.name + ' [' + act + '] -> Needs ' + u.pending + ' more (Promised: ' + u.promised + ', Delivered: ' + u.delivered + ')');
    });

    console.log('\\n=== FINAL SUMMARY ===');
    console.log('Total Paid Users (Active + Stopped): ' + (fulfilledUsers.length + pendingUsers.length));
    console.log('Total Promised Leads overall: ' + totalPromised);
    console.log('Total Delivered Leads overall: ' + totalDelivered);
    console.log('TOTAL PENDING LEADS REQUIRED TO FULLY SATISFY THIS TEAM: ' + totalPending);
}

main().catch(console.error);
