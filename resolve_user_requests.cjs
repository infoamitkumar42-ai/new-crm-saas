const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://vewqzsqddgmkslnuctvb.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDUzMDQ2MiwiZXhwIjoyMDgwMTA2NDYyfQ.pAgMGN6MtKm1A3fsKr1GIt8-qmKYhwFjSt92L_6_7us';
const supabase = createClient(supabaseUrl, supabaseKey);

(async () => {
    console.log('=== USER SUPPORT: PHASE 104 ===');

    // 1. Gurdeep (Investigate & Fix)
    console.log('\n--- 1. Gurdeep (`gurdeepgill613@gmail.com`) ---');
    const { data: gurdeep } = await supabase.from('users').select('*').eq('email', 'gurdeepgill613@gmail.com').single();
    if (gurdeep) {
        console.log(`Plan: ${gurdeep.plan_name}, Active: ${gurdeep.is_active}`);
        console.log(`Leads: ${gurdeep.total_leads_received} / ${gurdeep.total_leads_promised}`);
        console.log(`Valid Until: ${gurdeep.valid_until}`);

        // Check recent payments
        const { data: gPayments } = await supabase.from('payments').select('*').eq('user_id', gurdeep.id).order('created_at', { ascending: false }).limit(3);
        console.log('Payments:', gPayments.map(p => `${p.amount} (${new Date(p.created_at).toLocaleDateString()})`).join(', ') || 'None');

        // Auto-fix if payment found recently but quota low
        // Assuming 1999 = Weekly Boost (90 leads)
        // If he has pending payment from Yesterday/Today and quota is full, add leads.
    } else {
        console.log('User not found.');
    }

    // 2. Satnam (Reset Password)
    console.log('\n--- 2. Satnam (`ssatnam41912@gmail.com`) ---');
    const { data: satnam } = await supabase.from('users').select('id, email').eq('email', 'ssatnam41912@gmail.com').single();
    if (satnam) {
        const { error: resetError } = await supabase.auth.admin.updateUserById(satnam.id, { password: 'Seema123@' });
        if (resetError) console.error('Reset Failed:', resetError.message);
        else console.log('✅ Password Reset to Seema123@');
    } else {
        console.log('User not found.');
    }

    // 3. Prince (Audit Payments)
    console.log('\n--- 3. Prince (`Prince@gmail.com` or Name "Prince") ---');
    let prince = null;
    // Try email first
    let { data: pEmail } = await supabase.from('users').select('*').eq('email', 'Prince@gmail.com').single();
    if (pEmail) {
        prince = pEmail;
        console.log('Found by Email: Prince@gmail.com');
    } else {
        // Try Name
        let { data: pName } = await supabase.from('users').select('*').ilike('name', '%Prince%').limit(5);
        if (pName && pName.length > 0) {
            console.log(`Found ${pName.length} users with name "Prince":`);
            pName.forEach(u => console.log(`- ${u.name} (${u.email})`));
            // If only 1, use it. If multiple, asking user to clarify.
            if (pName.length === 1) prince = pName[0];
        } else {
            console.log('User not found by Email or Name.');
        }
    }

    if (prince) {
        console.log(`\nAuditing Payments for: ${prince.name} (${prince.email})`);
        console.log(`Current Plan: ${prince.plan_name}, Limit: ${prince.daily_limit}`);
        const { data: pPayments } = await supabase.from('payments').select('*').eq('user_id', prince.id).order('created_at', { ascending: false });
        if (pPayments && pPayments.length > 0) {
            console.table(pPayments.map(p => ({
                Date: new Date(p.created_at).toLocaleString(),
                Amount: p.amount,
                Status: p.status,
                Plan: p.plan_id // or metadata
            })));
        } else {
            console.log('No payments found.');
        }
    }

})();
