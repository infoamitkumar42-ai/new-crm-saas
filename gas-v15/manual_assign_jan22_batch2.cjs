const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function assignLeadsBatch2() {
    // Get user IDs
    const { data: gurnam } = await supabase.from('users').select('id, name').eq('email', 'gurnambal01@gmail.com').single();
    const { data: sandeep } = await supabase.from('users').select('id, name').eq('email', 'sunnymehre451@gmail.com').single();

    if (!gurnam || !sandeep) {
        console.log('Users not found');
        return;
    }

    console.log('Gurnam ID: ' + gurnam.id);
    console.log('Sandeep ID: ' + sandeep.id);

    // Raw lead data (12 leads)
    const leads = [
        { name: 'SiDHU SaaB', phone: '8264678760', city: 'Barnala' },
        { name: 'Agri Farmer', phone: '9815287604', city: 'Samrala' },
        { name: 'Ruchi', phone: '7419151954', city: 'Ambala' },
        { name: 'Vishavjeet Singh', phone: '7657972500', city: 'Sangrur Punjab' },
        { name: 'ਅਣਜਾਣ ਲਿਖਾਰੀ pb47', phone: '6283875216', city: 'Zira' },
        { name: 'Prabhjot Singh', phone: '9815580726', city: 'Ludhiana' },
        { name: 'ਕੁਦਰਤ', phone: '9056530524', city: 'Tarn Taran' },
        { name: 'Kuldeep singh', phone: '8968996784', city: 'Chandigarh' },
        { name: 'Mankirt Singh', phone: '9056985088', city: 'Kurali' },
        { name: 'Manjeet', phone: '78889094841', city: 'Patiala' }, // Phone seems long, likely typo in source, will clean
        { name: 'Love Pannu', phone: '6005434137', city: 'Tarn Taran' },
        { name: 'Simar Saab', phone: '8725913804', city: 'Nabha' }
    ];

    let gurnamCount = 0;
    let sandeepCount = 0;

    console.log('Assigning ' + leads.length + ' leads...');

    for (let i = 0; i < leads.length; i++) {
        const lead = leads[i];
        // Alternate assignment - Start with Sandeep (Previous batch started Gurnam)
        const userId = (i % 2 === 0) ? sandeep.id : gurnam.id;
        const userName = (i % 2 === 0) ? 'Sandeep' : 'Gurnam';

        // Basic phone cleaning
        let cleanPhone = lead.phone.replace(/[^0-9]/g, '');
        // Fix for "78889094841" -> likely 11 chars
        if (cleanPhone.length > 10 && cleanPhone.startsWith('91')) cleanPhone = cleanPhone.substring(2);
        else if (cleanPhone.length > 10) cleanPhone = cleanPhone.slice(-10); // Simple trim if no country code logic fits

        const { error } = await supabase.from('leads').insert({
            user_id: userId,
            name: lead.name,
            phone: cleanPhone,
            city: lead.city,
            state: 'Punjab', // Default
            source: 'Manual Assignment Jan22 Batch 2',
            status: 'Fresh'
        });

        if (error) {
            console.log('Error: ' + lead.name + ' - ' + error.message);
        } else {
            if (userId === gurnam.id) gurnamCount++;
            else sandeepCount++;
            console.log('Assigned: ' + lead.name + ' (' + cleanPhone + ') -> ' + userName);
        }
    }

    console.log('');
    console.log('DONE! Sandeep: ' + sandeepCount + ', Gurnam: ' + gurnamCount);
}

assignLeadsBatch2();
