const axios = require('axios');

const ACCESS_TOKEN = 'EAAMp6Xu8vQ8BQlncy3peZCgZAsZAt9lZAkGVh99IUZBgXq0mSsDaVufuJoAbzfgazv4ZARcwLLGLO2Fy40jJaMiAQx3c9p6pMCzeEqGU7gVxKkpI5ZByfcrt9xHbFE6pQ6FLDdh2axE3Cx8SofbD42ubLAD4SSzvNLAF2PWuxie66bhxyyHp0bCMYT7GwKBEHzF5xAg';
const formIds = ['2042478153195290', '1487798195872694', '833392899334397'];

async function checkLeadsAge() {
    const today = new Date().toISOString().split('T')[0];
    console.log(`Checking leads for: ${today}\n`);

    let totalUnder18 = 0;
    let totalLeadsChecked = 0;
    let ageDataFound = 0;

    for (const formId of formIds) {
        const url = `https://graph.facebook.com/v21.0/${formId}/leads?access_token=${ACCESS_TOKEN}&limit=500`;
        const response = await axios.get(url).catch(e => {
            console.error(`Error fetching form ${formId}:`, e.response?.data || e.message);
            return null;
        });

        if (response && response.data?.data) {
            const todaysLeads = response.data.data.filter(l => l.created_time.startsWith(today));
            totalLeadsChecked += todaysLeads.length;

            for (const lead of todaysLeads) {
                const fields = {};
                lead.field_data.forEach(f => { fields[f.name] = f.values?.[0] || ''; });

                // Look for age field (case insensitive)
                const ageKey = Object.keys(fields).find(k => k.toLowerCase().includes('age'));
                if (ageKey) {
                    ageDataFound++;
                    const age = parseInt(fields[ageKey]);
                    if (!isNaN(age) && age < 18) {
                        totalUnder18++;
                        console.log(`[Form ${formId}] Name: ${fields.full_name || 'N/A'}, Age: ${age} (UNDER 18)`);
                    }
                }
            }
        }
    }

    console.log(`\n--- FINAL REPORT ---`);
    console.log(`Total Leads Checked Today: ${totalLeadsChecked}`);
    console.log(`Leads with Age Data: ${ageDataFound}`);
    console.log(`Leads UNDER 18: ${totalUnder18}`);
}

checkLeadsAge();
