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
    const { data: activeUsers } = await supabase.from('users')
        .select('id, name, email')
        .eq('team_code', 'GJ01TEAMFIRE')
        .eq('is_active', true)
        .order('name');

    let totalPromised = 0;
    let totalDelivered = 0;
    let totalPending = 0;

    const fulfilledUsers = [];
    const pendingUsers = [];

    for (const u of (activeUsers || [])) {
        let { data: pays, error: pErr } = await supabase.from('payments')
            .select('amount, plan_name, razorpay_payment_id')
            .eq('user_id', u.id)
            .eq('status', 'captured');

        if (pErr) throw pErr;
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

        totalPromised += userPromised;
        totalDelivered += d;
        totalPending += pending;

        if (pending === 0) {
            fulfilledUsers.push({ name: u.name, promised: userPromised, delivered: d });
        } else {
            pendingUsers.push({ name: u.name, promised: userPromised, delivered: d, pending: pending });
        }
    }

    console.log('=== GJ01TEAMFIRE LEAD AUDIT AFTER BULK ASSIGNMENT ===\\n');

    console.log('[USERS WHOSE QUOTA IS NOW COMPLETE]' + (fulfilledUsers.length === 0 ? ' (None)' : ''));
    fulfilledUsers.forEach(u => {
        console.log('  ✅ ' + u.name + ' (Promised: ' + u.promised + ', Delivered: ' + u.delivered + ')');
    });

    console.log('\\n[USERS WHO STILL NEED LEADS]');
    pendingUsers.sort((a, b) => b.pending - a.pending).forEach(u => {
        console.log('  ⏳ ' + u.name + ' -> Needs ' + u.pending + ' more leads (Promised: ' + u.promised + ', Delivered: ' + u.delivered + ')');
    });

    console.log('\\n=== FINAL SUMMARY ===');
    console.log('Total Active Paid Users: ' + (fulfilledUsers.length + pendingUsers.length));
    console.log('Total Promised Leads: ' + totalPromised);
    console.log('Total Delivered Leads: ' + totalDelivered);
    console.log('TOTAL PENDING LEADS REQUIRED TO FULFILL EVERYONE: ' + totalPending);
}

main().catch(console.error);
