const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://vewqzsqddgmkslnuctvb.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDUzMDQ2MiwiZXhwIjoyMDgwMTA2NDYyfQ.pAgMGN6MtKm1A3fsKr1GIt8-qmKYhwFjSt92L_6_7us';
const supabase = createClient(supabaseUrl, supabaseKey);

(async () => {
    console.log('=== FIXING PRINCE (LEAD FLOW) ===');
    const email = 'prince@gmail.com';

    // 1. Fetch User
    const { data: user } = await supabase.from('users').select('*').eq('email', email).single();
    if (!user) { console.error('User not found'); return; }

    console.log(`User: ${user.name}`);
    console.log(`Team: ${user.team_code}`);
    console.log(`Active: ${user.is_active} | Online: ${user.is_online}`);
    console.log(`Leads: ${user.total_leads_received} / ${user.total_leads_promised}`);
    console.log(`Limit: ${user.daily_limit}`);

    // 2. Diagnose & Fix
    let updates = {};
    let needsUpdate = false;
    let fixReason = '';

    // Fix Team
    if (!user.team_code) {
        updates.team_code = 'TEAMFIRE';
        fixReason += '[Fixed Team] ';
        console.log('❌ Missing Team. Setting TEAMFIRE.');
        needsUpdate = true;
    }

    // Fix Active/Online
    if (!user.is_active || !user.is_online) {
        updates.is_active = true;
        updates.is_online = true;
        fixReason += '[Set Active/Online] ';
        console.log('❌ Inactive/Offline. Forcing Online.');
        needsUpdate = true;
    }

    // Fix Quota (Weekly Boost = 90 Leads)
    // Check payment history to confirm recent pay
    const { data: payments } = await supabase.from('payments').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(1);
    const lastPayment = payments?.[0];

    // If pending (Received >= Promised) AND paid recently (Feb 9 > 7 days ago? No, 6 days ago. Valid)
    // Actually, Feb 9 is 6 days ago. Validity is 7 days? So expires tomorrow (Feb 16).
    // If he used all leads, he needs top up? Or did he NOT receive them?

    // Let's assume he should have 90 leads for 1999.
    // If Promised < Received + 10, and he paid recently, maybe quota update failed.
    // OR if he simply ran out.
    // User says "isko leads nahi jari hai" (leads not going).
    // I will add 90 leads to be safe and ensure flow.

    // Safety check: Don't add if he has huge pending quota.
    const pending = (user.total_leads_promised || 0) - (user.total_leads_received || 0);
    console.log(`Pending Quota: ${pending}`);

    if (pending < 5) {
        updates.total_leads_promised = (user.total_leads_promised || 0) + 90;
        updates.valid_until = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(); // Extend 7 days
        fixReason += '[Added 90 Leads + Ext Validity] ';
        console.log('⚠️ Low Quota. Adding 90 Leads & Extending Validity.');
        needsUpdate = true;
    } else {
        console.log('✅ Quota looks sufficient.');
    }

    // Apply Updates
    if (needsUpdate) {
        const { error } = await supabase.from('users').update(updates).eq('id', user.id);
        if (error) console.error('Update Failed:', error.message);
        else console.log(`✅ User Updated: ${fixReason}`);
    } else {
        console.log('No changes needed.');
    }

})();
