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
        { name: 'Garcha Saab', phone: '9592295417', city: 'khamano' },
        { name: 'Amaninder S Nellon', phone: '7087530211', city: 'Ludhiana' },
        { name: 'Harvinder Lal', phone: '8872429724', city: 'noormhil, Jalandhar Punjab' },
        { name: 'Mani Verma', phone: '9878530884', city: 'payal' },
        { name: 'Saurabh', phone: '7900062090', city: 'Fatehabad Haryana' },
        { name: 'Jaideep Singh', phone: '6239280548', city: 'Ferozepur' },
        { name: 'ਦੁਸ਼ਟ ਆਤਮਾ', phone: '9781864196', city: 'Ludhiana' },
        { name: 'jatinder singh', phone: '8847603581', city: 'Patiala' },
        { name: 'G_u_r_i', phone: '8264438500', city: 'Sri Muktsar Sahib' },
        { name: 'Manpreet Baggar', phone: '9877009567', city: 'Ludhiana' },
        { name: 'harrman', phone: '7973684063', city: 'jalandhar' },
        { name: 'Arvin Chouhan', phone: '9877581547', city: 'Barnala' },
        { name: 'Akash Deep Singh', phone: '8568065973', city: 'Amritsar' },
        { name: 'Manjinder Singh', phone: '7347278001', city: 'Barnala Mehal Kalan' },
        { name: 'Er Yogesh Kumar', phone: '9464230858', city: 'Mukerian' },
        { name: 'Harjit singh', phone: '9878695281', city: 'tarn taran, punjab' },
        { name: 'shrma_huni', phone: '8872558078', city: 'Sunam , punjab' },
        { name: 'tanveersandhu', phone: '7087718726', city: 'Amritsar' },
        { name: 'zindagi', phone: '9041805943', city: 'Ludhiana' },
        { name: 'Harpreet Singh Ranu', phone: '8968930760', city: 'Malerkotla' },
        { name: 'O G Ahmad', phone: '8847328640', city: 'Khanna' },
        { name: 'Poonam Deepak Gogia', phone: '6283088987', city: 'Ludhiana' },
        { name: 'Navjot Singh', phone: '8566949167', city: 'Samrala' },
        { name: 'Sukhwinder Singh', phone: '8872309560', city: 'Ludhiana' },
        { name: 'ਸੁਮਨਪ੍ਰੀਤ ਕੌਰ', phone: '7710771754', city: 'Ludhiana' },
        { name: 'Gurbinder Sivia', phone: '9855302793', city: 'Gangsar jaitu' },
        { name: 'Mandeep Singh', phone: '9592591149', city: 'Dabwala kalan' },
        { name: 'Reet', phone: '9877909827', city: 'Jalandhar' },
        { name: 'Anjali', phone: '8558015933', city: 'Amritsar' },
        { name: 'Harpreet Singh', phone: '8425973350', city: 'sbs nagar' },
        { name: 'Gursharanjeet Singh', phone: '9646887371', city: 'Sirhind' }
    ];

    let gurnamCount = 0;
    let sandeepCount = 0;

    console.log('Assigning ' + leads.length + ' leads...');

    for (let i = 0; i < leads.length; i++) {
        const lead = leads[i];
        // Alternate assignment - Starting with Gurnam this time to balance previous batch
        const userId = (i % 2 === 0) ? gurnam.id : sandeep.id;
        const userName = (i % 2 === 0) ? 'Gurnam' : 'Sandeep';

        // Basic phone cleaning
        let cleanPhone = lead.phone.replace(/[^0-9]/g, '');
        if (cleanPhone.startsWith('91') && cleanPhone.length > 10) cleanPhone = cleanPhone.substring(2);

        const { error } = await supabase.from('leads').insert({
            user_id: userId,
            name: lead.name,
            phone: cleanPhone,
            city: lead.city,
            state: 'Punjab',
            source: 'Manual Assignment Jan22',
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
    console.log('DONE! Gurnam: ' + gurnamCount + ', Sandeep: ' + sandeepCount);
}

assignLeads();
