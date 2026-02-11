const { createClient } = require('@supabase/supabase-js');
const axios = require('axios');

const supabase = createClient('https://vewqzsqddgmkslnuctvb.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDUzMDQ2MiwiZXhwIjoyMDgwMTA2NDYyfQ.pAgMGN6MtKm1A3fsKr1GIt8-qmKYhwFjSt92L_6_7us');
const ACCESS_TOKEN = 'EAAMp6Xu8vQ8BQlncy3peZCgZAsZAt9lZAkGVh99IUZBgXq0mSsDaVufuJoAbzfgazv4ZARcwLLGLO2Fy40jJaMiAQx3c9p6pMCzeEqGU7gVxKkpI5ZByfcrt9xHbFE6pQ6FLDdh2axE3Cx8SofbD42ubLAD4SSzvNLAF2PWuxie66bhxyyHp0bCMYT7GwKBEHzF5xAg';
const formIds = ['2042478153195290', '1487798195872694', '833392899334397'];

async function deleteUnderageLeads() {
    const today = new Date().toISOString().split('T')[0];
    console.log(`Searching for leads to delete for date: ${today}\n`);

    let deleteCount = 0;
    const phonesToDelete = [];

    for (const formId of formIds) {
        const url = `https://graph.facebook.com/v21.0/${formId}/leads?access_token=${ACCESS_TOKEN}&limit=500`;
        const response = await axios.get(url).catch(e => {
            console.error(`Error fetching form ${formId}:`, e.response?.data || e.message);
            return null;
        });

        if (response && response.data?.data) {
            const todaysLeads = response.data.data.filter(l => l.created_time.startsWith(today));

            for (const lead of todaysLeads) {
                const fields = {};
                lead.field_data.forEach(f => { fields[f.name] = f.values?.[0] || ''; });

                const ageKey = Object.keys(fields).find(k => k.toLowerCase().includes('age'));
                if (ageKey) {
                    const age = parseInt(fields[ageKey]);
                    if (!isNaN(age) && age < 18) {
                        let rawPhone = fields.phone_number || fields.phoneNumber || fields.phone || fields.mobile || '';
                        const phone = (rawPhone || '').replace(/\D/g, '').slice(-10);
                        if (phone && phone.length === 10) {
                            phonesToDelete.push(phone);
                        }
                    }
                }
            }
        }
    }

    if (phonesToDelete.length > 0) {
        console.log(`Found ${phonesToDelete.length} unique phones to clean up.`);

        // Delete or mark as Invalid
        const { data, error } = await supabase
            .from('leads')
            .delete()
            .in('phone', phonesToDelete);

        if (error) {
            console.error('Error deleting leads:', error.message);
        } else {
            console.log(`✅ Successfully deleted ${phonesToDelete.length} leads from database.`);
        }
    } else {
        console.log('No underage leads found in today\'s set.');
    }
}

deleteUnderageLeads();
