const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://vewqzsqddgmkslnuctvb.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDUzMDQ2MiwiZXhwIjoyMDgwMTA2NDYyfQ.pAgMGN6MtKm1A3fsKr1GIt8-qmKYhwFjSt92L_6_7us';
const supabase = createClient(supabaseUrl, supabaseKey);

const userList = [
    { phone: '9829227495', name: 'Kk' },
    { phone: '9811430444', name: '❅ᴍᴏʜᴅ༺Shahnawaz༻...' },
    { phone: '8427852752', name: 'Deep Bhullar' },
    { phone: '7977132459', name: 'Asif Mohd Akram Ansari' },
    { phone: '8770687117', name: 'Ni' },
    { phone: '8557823861', name: 'ਅੰਬਰਸਿਰਿਆ' },
    { phone: '6263553617', name: 'ᴍʀ,ᴠɪꜱʜᴡᴀᴋᴀʀᴍᴀ26' },
    { phone: '7889518862', name: '𝐀𝐤𝐚𝐧𝐤𝐬𝐡𝐚' },
    { phone: '7973464065', name: 'Leader YT' },
    { phone: '7708254027', name: 'Dio Jimikily' }
];

(async () => {
    console.log('--- 🔍 TRACING SPECIFIC META LEADS ---');

    // Normalize phones for search (searching both with and without +91)
    const phones = userList.map(u => u.phone);
    const phonesWithPlus = userList.map(u => '+91' + u.phone);
    const allQueryPhones = [...phones, ...phonesWithPlus];

    const { data: leads, error } = await supabase
        .from('leads')
        .select('name, phone, status, source, created_at, users!leads_assigned_to_fkey(name, email)')
        .in('phone', allQueryPhones);

    if (error) {
        console.error('Error:', error);
        return;
    }

    console.log(`Matched ${leads.length} out of ${userList.length} leads in DB.\n`);

    console.log('| Lead Name | Phone | Status | Assigned To | Source | Created At (IST) |');
    console.log('|---|---|---|---|---|---|');

    leads.forEach(l => {
        const date = new Date(l.created_at);
        const istTime = date.toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata', hour12: true });
        const assigned = l.users ? l.users.name : 'PENDING';

        console.log(`| ${l.name} | ${l.phone} | ${l.status} | ${assigned} | ${l.source.substring(0, 15)}... | ${istTime} |`);
    });

    // Check for leads NOT found
    const foundPhones = leads.map(l => l.phone.replace('+91', ''));
    const missing = userList.filter(u => !foundPhones.includes(u.phone));

    if (missing.length > 0) {
        console.log('\n⚠️ Leads NOT YET in System (Waiting for Meta Webhook):');
        missing.forEach(m => console.log(`- ${m.name} (${m.phone})`));
    }
})();
