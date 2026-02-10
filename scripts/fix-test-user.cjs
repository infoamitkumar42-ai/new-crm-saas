const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function investigateAndFix() {
    console.log('--- Investigating test@gmail.com ---');
    const email = 'test@gmail.com';

    // 1. Fetch User
    const { data: users } = await supabase.from('users').select('*').eq('email', email);
    if (!users || users.length === 0) {
        console.log('User not found.');
    } else {
        const user = users[0];
        console.log('User Details:', { id: user.id, name: user.name, status: user.is_active });

        // 2. Fetch All Payments
        const { data: payments } = await supabase.from('payments').select('*');

        // 3. Find EXACT match in payments
        const matches = payments.filter(p => {
            const s = JSON.stringify(p).toLowerCase();
            return s.includes(email.toLowerCase()) || s.includes('"test"');
        });

        console.log(`Found ${matches.length} matching payments.`);
        matches.forEach(m => {
            console.log('Match Found in Payment:', {
                id: m.id,
                payer: m.payer_email,
                payload: JSON.stringify(m.raw_payload).slice(0, 100) + '...'
            });
        });

        // 4. DEACTIVATE IMMEDIATELY
        console.log('Deactivating test@gmail.com...');
        await supabase.from('users').update({
            is_active: false,
            payment_status: 'inactive',
            daily_limit: 0,
            valid_until: null
        }).eq('id', user.id);
        console.log('✅ Deactivated.');
    }

    // 5. Check for other "Test" users
    console.log('\n--- Checking for other "Test" users ---');
    const { data: otherTests } = await supabase.from('users').select('id, name, email, is_active').ilike('name', '%test%');
    console.table(otherTests);

    const activeTests = otherTests.filter(u => u.is_active && u.email !== 'sharmahimanshu9797@gmail.com');
    if (activeTests.length > 0) {
        console.log(`Found ${activeTests.length} other active test users. Deactivating...`);
        for (const u of activeTests) {
            await supabase.from('users').update({ is_active: false, payment_status: 'inactive' }).eq('id', u.id);
            console.log(`✅ Deactivated ${u.name} (${u.email})`);
        }
    }
}

investigateAndFix();
