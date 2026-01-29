const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function assignLeadsToSandeep() {
    // Get Sandeep's ID
    const { data: sandeep } = await supabase.from('users').select('id, name').eq('email', 'sunnymehre451@gmail.com').single();

    if (!sandeep) {
        console.log('Sandeep not found');
        return;
    }

    console.log('Sandeep ID: ' + sandeep.id);

    // Raw lead data
    const leads = [
        { name: 'Deep sandhu', phone: '7347264855', city: 'Ferozpur' },
        { name: 'Iqbal Singh Sran', phone: '9780342592', city: 'Firozpur' },
        { name: 'Karan Dosanjh Karan Dosanjh', phone: '7347594300', city: 'Phagwara' },
        { name: 'Rajveer Guron', phone: '9815717426', city: 'Samrala' }
    ];

    let count = 0;

    console.log('Assigning ' + leads.length + ' leads to Sandeep...');

    for (const lead of leads) {
        // Basic phone cleaning
        let cleanPhone = lead.phone.replace(/[^0-9]/g, '');
        if (cleanPhone.startsWith('91') && cleanPhone.length > 10) cleanPhone = cleanPhone.substring(2);

        const { error } = await supabase.from('leads').insert({
            user_id: sandeep.id,
            name: lead.name,
            phone: cleanPhone,
            city: lead.city,
            state: 'Punjab',
            source: 'Manual Assignment Jan22 Morning',
            status: 'Fresh'
        });

        if (error) {
            console.log('Error: ' + lead.name + ' - ' + error.message);
        } else {
            count++;
            console.log('Assigned: ' + lead.name + ' (' + cleanPhone + ') -> Sandeep');
        }
    }

    console.log('');
    console.log('DONE! Assigned ' + count + ' leads to Sandeep.');
}

assignLeadsToSandeep();
