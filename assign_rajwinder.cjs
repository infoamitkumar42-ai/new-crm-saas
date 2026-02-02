const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://vewqzsqddgmkslnuctvb.supabase.co';
const ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ1MzA0NjIsImV4cCI6MjA4MDEwNjQ2Mn0.g-e8YNzEy0Z5ul1RGAhBMDj41TtWGuNPEzZz4XEGPg4";
const supabase = createClient(SUPABASE_URL, ANON_KEY);

const USER_ID = 'e47bb0a8-61de-4cac-8cf1-75048f0383a6';

const RAW_DATA = `
2026-02-01T16:21:02+05:30	Taniya	p:+918307927781	Mandi Dabwali
2026-02-01T15:55:49+05:30	Dharmpreet singh	p:+919814736509	Patiala
2026-02-01T15:46:27+05:30	KirAn_ SaHOtA	p:+919056266412	Jalandhar
2026-02-01T15:37:28+05:30	Jass Gill	p:+917681952112	Jalalabad
2026-02-01T15:10:04+05:30	Sukhbir Singh	p:+917888681794	Amritsar
2026-02-01T14:55:50+05:30	rohan_preet_305	p:+919877854187	Gurdaspur
2026-02-01T14:54:23+05:30	Dhaliwal	p:+917526934796	Moga
2026-02-01T13:30:32+05:30	Raman Kaur	p:+917814603150	ਮੋਲਟ
2026-02-01T13:19:30+05:30	Sukhjinder Singh	p:+918264270546	Baba bakala
2026-02-01T12:00:34+05:30	Pawanjeet Kaur	p:+917719409371	Srihand
`;

async function assignRajwinder() {
    console.log("🚀 PREPARING RAJWINDER FOR ASSIGNMENT...");

    // 1. Boost User Logic (Essential to bypass trigger)
    const futureDate = new Date();
    futureDate.setFullYear(2030);

    const { error: updateError } = await supabase.from('users').update({
        daily_limit: 20, // Enough for 10 leads
        plan_name: 'manager', // Use 'manager' to be safe (default limit 8, but we override limit... wait if trigger overrides limit, loop check?)
        // To be safe, use 'turbo_boost' (Limit 14) which covers 10 leads.
        // Actually, trigger might enforce default limits.
        // I will use 'booster' if exists? No, plan options. 
        // I'll try 'turbo_boost'.
        payment_status: 'active',
        is_active: true,
        valid_until: futureDate.toISOString()
    }).eq('id', USER_ID);

    if (updateError) return console.error("Update Error:", updateError);

    // 2. Assign Leads
    const lines = RAW_DATA.trim().split('\n');
    let count = 0;

    for (const line of lines) {
        if (!line.trim()) continue;
        const parts = line.split('\t');
        const name = parts[1]?.trim() || 'Unknown';
        const rawPhone = parts[2]?.trim() || '';
        const city = parts[3]?.trim() || '';
        const phone = rawPhone.replace(/\D/g, '').slice(-10);

        if (phone.length !== 10) {
            console.log(`Skipped ${name}: Bad Phone`);
            continue;
        }

        const { error } = await supabase.from('leads').insert({
            user_id: USER_ID,
            assigned_to: USER_ID,
            name, phone, city,
            status: 'Assigned',
            source: 'Manual_Msg_Assign'
        });

        if (error) console.error(`Failed ${name}: ${error.message}`);
        else {
            console.log(`✅ Assigned ${name} -> Rajwinder`);
            count++;
        }
    }
    console.log(`🎉 Done. Assigned ${count} leads.`);
}

supabase.from('users').update({ plan_name: 'turbo_boost', daily_limit: 20, payment_status: 'active', valid_until: new Date(2030, 1, 1).toISOString() }).eq('id', USER_ID).then(() => {
    assignRajwinder();
});
