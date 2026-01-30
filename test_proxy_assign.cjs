const { createClient } = require('@supabase/supabase-js');

// HARDCODED CREDENTIALS
const SUPABASE_URL = 'https://vewqzsqddgmkslnuctvb.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDUzMDQ2MiwiZXhwIjoyMDgwMTA2NDYyfQ.pAgMGN6MtKm1A3fsKr1GIt8-qmKYhwFjSt92L_6_7us';
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function testProxy() {
    console.log('--- PROXY TEST ---');

    // 1. Get Ajay (Valid User)
    const { data: ajay } = await supabase.from('users').select('id, name').eq('name', 'Ajay kumar').single();
    if (!ajay) { console.log('Ajay not found'); return; }

    // 2. Get Rajwinder (Blocked User)
    const { data: raj } = await supabase.from('users').select('id, name').eq('email', 'workwithrajwinder@gmail.com').single();
    if (!raj) { console.log('Raj not found'); return; }

    console.log(`Ajay: ${ajay.id}`);
    console.log(`Raj: ${raj.id}`);

    // 3. Insert to Ajay
    const phone = '9999999999';
    console.log('Inserting to Ajay...');

    const { data: lead, error: insErr } = await supabase.from('leads').insert({
        name: 'TEST LEAD PROXY',
        phone: phone,
        city: 'Test City',
        source: 'Manual Import',
        status: 'Assigned',
        user_id: ajay.id,
        assigned_to: ajay.id
    }).select().single();

    if (insErr) {
        console.log('Insert Error:', insErr.message);
        return;
    }
    console.log(`Inserted Lead ID: ${lead.id}`);

    // 4. Update to Rajwinder
    console.log('Moving to Rajwinder...');
    const { error: upErr } = await supabase.from('leads').update({
        user_id: raj.id,
        assigned_to: raj.id
    }).eq('id', lead.id);

    if (upErr) console.log('Update Error:', upErr.message);
    else console.log('✅ MOVED SUCCESSFULLY!');
}

testProxy();
