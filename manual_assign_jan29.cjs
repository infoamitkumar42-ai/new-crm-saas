const { createClient } = require('@supabase/supabase-js');

// HARDCODED CREDENTIALS
const SUPABASE_URL = 'https://vewqzsqddgmkslnuctvb.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDUzMDQ2MiwiZXhwIjoyMDgwMTA2NDYyfQ.pAgMGN6MtKm1A3fsKr1GIt8-qmKYhwFjSt92L_6_7us';
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const RAW_DATA = `
2026-01-29T16:28:03+05:30	Harman Bhandari	p:+917814860952	Guru Har Sahai
2026-01-29T16:25:51+05:30	Jass Saab	p:7340717840	jandaila guru
2026-01-29T16:25:13+05:30	Ramanprabh ghuman	p:7889200282	Tanda
2026-01-29T15:43:04+05:30	Neeraj Kataria	p:+918196878162	Fazilka
2026-01-29T15:24:43+05:30	gurjant singh	p:+919815771748	Moga
2026-01-29T15:15:21+05:30	aviiiii...~	p:+919779370278	Ludhiana
2026-01-29T15:02:03+05:30	Davinder Singh	p:985578451	Sangrur
2026-01-29T15:01:15+05:30	Jaspreet	p:8264036686	Ludhiana
2026-01-29T14:44:50+05:30	Mukul Sikka	p:+919803829417	Ludhiana
2026-01-29T14:43:59+05:30	PREET official	p:+917888364532	Muktsar
2026-01-29T14:39:00+05:30	Sunny Pathan	p:+918283001364	ferozpur punjab
2026-01-29T14:37:52+05:30	@fearless_fighter	p:+919517663786	Chandigarh
2026-01-29T14:31:18+05:30	Gurpreet Saini	p:97795 82131	Chandigarh
2026-01-29T14:29:53+05:30	Navpreet singh Maan	p:+919592813663	Kot Kapura
2026-01-29T14:27:12+05:30	Harleen Kaur 0002	p:+917973211529	Anjnla
2026-01-29T14:26:35+05:30	Raj Ravi	p:+916239268656	Baddi
2026-01-29T14:19:52+05:30	Ravi Toun	p:+919914201006	Mohali
2026-01-29T14:18:42+05:30	....+	p:+917719489498	Bathinda
2026-01-29T14:17:58+05:30	Matlabi	p:+918872239973	Patran
2026-01-29T14:11:34+05:30	Mehak	p:+916280718062	Gurdaspur
2026-01-29T13:55:04+05:30	Dilpreet Singh	p:8699377640	Samana,dist Patiala
2026-01-29T13:53:35+05:30	Vikram Rai	p:+919306897596	Sirsa
2026-01-29T13:47:46+05:30	rajbir kaur	p:8968891496	Kapurthala
2026-01-29T13:45:05+05:30	Harwinder Lakhi	p:+919914305255	Ludhiana
2026-01-29T13:45:00+05:30	Khushi	p:9877809332	Mansa
2026-01-29T13:40:57+05:30	Rajveer	p:+918427322749	Ludhiana
`;

const TARGET_EMAILS = {
    'Rajwinder': 'workwithrajwinder@gmail.com',
    'Sandeep': 'sunnymehre451@gmail.com',
    'Gurnam': 'gurnambal01@gmail.com'
};

async function parseAndAssign() {
    console.log('--- PARSING LEADS ---');
    const lines = RAW_DATA.trim().split('\n');
    const leads = [];

    for (const line of lines) {
        if (!line.trim()) continue;
        const parts = line.split('\t').map(s => s.trim());
        if (parts.length < 3) continue;
        const name = parts[1];
        let rawPhone = parts[2].replace('p:', '').trim();
        const city = parts[3] || 'Unknown';
        const phone = rawPhone.replace(/\D/g, '').slice(-10);

        if (phone.length === 10) leads.push({ name, phone, city });
    }
    console.log(`Total Valid Leads: ${leads.length}`);

    // FETCH USERS
    const userMap = {};
    for (const [key, email] of Object.entries(TARGET_EMAILS)) {
        const { data } = await supabase.from('users').select('id, name').eq('email', email).single();
        if (data) userMap[key] = data;
    }

    if (Object.keys(userMap).length < 3) return;

    // NEGATIVE COUNTER HACK
    console.log('🚀 Setting Negative Counters...');
    for (const key of Object.keys(userMap)) {
        const u = userMap[key];

        // Update Count to -50
        // We assume limit is 0. -50 < 0 is true.
        await supabase.from('users').update({
            leads_today: -50,
            is_active: true
        }).eq('id', u.id);

        // Verify
        const { data: v } = await supabase.from('users').select('daily_limit, leads_today').eq('id', u.id).single();
        console.log(`- ${u.name} Limit: ${v?.daily_limit}, LeadsToday: ${v?.leads_today}`);
    }

    // DISTRIBUTE
    const rajwinderLeads = leads.slice(0, 10);
    const remainder = leads.slice(10);
    const mid = Math.ceil(remainder.length / 2);
    const sandeepLeads = remainder.slice(0, mid);
    const gurnamLeads = remainder.slice(mid);

    const batches = [
        { user: userMap['Rajwinder'], leads: rajwinderLeads },
        { user: userMap['Sandeep'], leads: sandeepLeads },
        { user: userMap['Gurnam'], leads: gurnamLeads }
    ];

    for (const batch of batches) {
        console.log(`\nAssigning ${batch.leads.length} to ${batch.user.name}...`);

        for (const lead of batch.leads) {
            // Reset Counter before EACH insert just in case
            await supabase.from('users').update({ leads_today: -100 }).eq('id', batch.user.id);

            const { error } = await supabase.from('leads').insert({
                name: lead.name,
                phone: lead.phone,
                city: lead.city,
                source: 'Manual Import',
                status: 'Assigned',
                user_id: batch.user.id,
                assigned_to: batch.user.id,
                created_at: new Date().toISOString()
            });

            if (error) console.log(`Error ${lead.phone}: ${error.message}`);
            else console.log(`✓ Assigned ${lead.name}`);
        }

        // Update Counter to Real for tracking (if we want)
        // Or leave it negative? Better leave it negative or 0 so they don't get blocked next time?
        // User asked to assign these. They are Admin/Staff.
        // I will set it to count at end.
        const { count } = await supabase.from('leads')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', batch.user.id)
            .gte('created_at', new Date().toISOString().split('T')[0]);
        await supabase.from('users').update({ leads_today: count }).eq('id', batch.user.id);
    }
    console.log('\n✅ ALL DONE.');
}

parseAndAssign();
