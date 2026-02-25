const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
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
    console.log("🔍 STRICT AUDIT: 58 ACTIVE TEAMFIRE USERS\n");

    const { data: activeUsers } = await supabase.from('users')
        .select('id, name, email, created_at, is_active')
        .eq('team_code', 'TEAMFIRE')
        .eq('is_active', true)
        .order('name');

    let totalPromised = 0;
    let totalDelivered = 0;
    let totalPending = 0;
    let validUserCount = 0;

    const reportLines = [];
    reportLines.push("STRICT AUDIT REPORT - " + new Date().toISOString() + "\n");

    for (const u of (activeUsers || [])) {
        // Get captured payments
        let { data: pays } = await supabase.from('payments')
            .select('amount, plan_name, razorpay_payment_id, created_at')
            .eq('user_id', u.id)
            .eq('status', 'captured')
            .order('created_at');

        // Handle Sejal's manual payment
        if (u.email === 'sejalrani72@gmail.com' && (!pays || pays.length === 0)) {
            pays = [{ amount: 999, plan_name: 'starter', created_at: '2026-02-04T00:00:00Z', razorpay_payment_id: 'manual_sejal' }];
        }

        if (!pays || pays.length === 0) continue; // Skip if still no payment

        validUserCount++;
        const seen = new Set();
        let userPromised = 0;
        const payLog = [];

        for (const p of pays) {
            const rp = p.razorpay_payment_id || `null_${Math.random()}`;
            if (seen.has(rp)) continue; // Deduplicate
            seen.add(rp);

            const planData = getPlan(p.amount, p.plan_name);
            userPromised += planData.l;
            payLog.push(`₹${p.amount}(${planData.p}) on ${p.created_at.split('T')[0]}`);
        }

        // Get EXACT delivered leads count
        const { count: delivered } = await supabase.from('leads')
            .select('*', { count: 'exact', head: true })
            .eq('assigned_to', u.id);

        const d = delivered || 0;
        const pending = Math.max(0, userPromised - d);

        totalPromised += userPromised;
        totalDelivered += d;
        totalPending += pending;

        const uLine = `${validUserCount}. ${u.name} (${u.email})`;
        const pLine = `   Payments: ${payLog.join(' | ')}`;
        const sLine = `   Promised: ${userPromised} | Delivered: ${d} | PENDING: ${pending}`;

        reportLines.push(uLine);
        reportLines.push(pLine);
        reportLines.push(sLine);
        reportLines.push("");

        console.log(uLine);
        console.log(sLine);
    }

    const summary = `\n=== FINAL SUMMARY ===\n` +
        `Total Active Paid Users: ${validUserCount}\n` +
        `Total Promised Leads: ${totalPromised}\n` +
        `Total Delivered Leads: ${totalDelivered}\n` +
        `TOTAL PENDING LEADS: ${totalPending}\n`;

    reportLines.push(summary);
    console.log(summary);

    fs.writeFileSync('final_58_audit.txt', reportLines.join('\n'), 'utf8');
    console.log("Full details saved to final_58_audit.txt");
}

main().catch(console.error);
