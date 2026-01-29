const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function assignLeads() {
    // Get user IDs
    const { data: gurnam } = await supabase.from('users').select('id, name').eq('email', 'gurnambal01@gmail.com').single();
    const { data: sandeep } = await supabase.from('users').select('id, name').eq('email', 'sunnymehre451@gmail.com').single();

    if (!gurnam || !sandeep) {
        console.log('Users not found');
        return;
    }

    console.log('Gurnam ID: ' + gurnam.id);
    console.log('Sandeep ID: ' + sandeep.id);

    // Raw lead data
    const leads = [
        { name: 'Ankit...', phone: '9780674278', city: 'Ludhiana' },
        { name: 'K_p', phone: '7963352355', city: 'Khanna' },
        { name: 'Kaur Navneet', phone: '8699280595', city: 'Amritsar' },
        { name: 'Jaskaran Singh', phone: '16239400817', city: 'Punjab' }, // Keeping as is, though looks non-Indian or has country code issues
        { name: 'khushi', phone: '8847693383', city: 'payal' },
        { name: 'Feroz Khan', phone: '9814616305', city: 'sirhind' },
        { name: 'Shamsher Singh Dhunna', phone: '9914110978', city: 'Amritsar' },
        { name: 'gurimaleem', phone: '8198016812', city: 'Sunam' },
        { name: 'INDER', phone: '8397975025', city: 'Kurukshetra' },
        { name: 'Bhatti Bhatti', phone: '9876370196', city: 'Moga' },
        { name: 'Vikas kumar', phone: '8427645499', city: 'Kapurthala . kala sanghian' },
        { name: 'Navu', phone: '9876293958', city: 'Ludhiana' },
        { name: 'S̶U̶N̶N̶Y̶ 𓅓', phone: '7707985079', city: 'Ludhiana' },
        { name: 'Dhamrait Parmjeet', phone: '6283087436', city: 'Aerocity' },
        { name: 'ਮਨੀ', phone: '8360539824', city: 'Khamano fatehgarh Sahib Punjab' },
        { name: 'Er Ramandeep Singh', phone: '7009393063', city: 'Chandigarh' },
        { name: 'Sukhvirsingh', phone: '9878422531', city: 'Rajpura' }
    ];

    let gurnamCount = 0;
    let sandeepCount = 0;

    console.log('Assigning ' + leads.length + ' leads...');

    for (let i = 0; i < leads.length; i++) {
        const lead = leads[i];
        // Alternate assignment
        const userId = (i % 2 === 0) ? sandeep.id : gurnam.id; // Sandeep first this time (or alternate from previous batch if preferred, but simpler to just alternate)
        const userName = (i % 2 === 0) ? 'Sandeep' : 'Gurnam';

        // Clean phone for database if needed, but inserting as provided for manual
        // Note: DB constraints might strict check 10 digits for some systems, but our schema is TEXT.
        // We'll trust the input or minimal clean
        let cleanPhone = lead.phone.replace(/[^0-9]/g, '');
        if (cleanPhone.startsWith('91') && cleanPhone.length > 10) cleanPhone = cleanPhone.substring(2);

        const { error } = await supabase.from('leads').insert({
            user_id: userId,
            name: lead.name,
            phone: cleanPhone, // Storing cleaned phone
            city: lead.city,
            state: 'Punjab', // Defaulting as mostly Punjab cities
            source: 'Manual Assignment Jan21',
            status: 'Fresh'
        });

        if (error) {
            console.log('Error: ' + lead.name + ' - ' + error.message);
        } else {
            if (i % 2 === 0) sandeepCount++;
            else gurnamCount++;
            console.log('Assigned: ' + lead.name + ' (' + cleanPhone + ') -> ' + userName);
        }
    }

    console.log('');
    console.log('DONE! Sandeep: ' + sandeepCount + ', Gurnam: ' + gurnamCount);
}

assignLeads();
