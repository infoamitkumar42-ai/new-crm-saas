const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://vewqzsqddgmkslnuctvb.supabase.co';
const ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ1MzA0NjIsImV4cCI6MjA4MDEwNjQ2Mn0.g-e8YNzEy0Z5ul1RGAhBMDj41TtWGuNPEzZz4XEGPg4";
const supabase = createClient(SUPABASE_URL, ANON_KEY);

const RAW_DATA = `
2026-02-01T09:08:10+05:30	Aman	p:+919779244013	Ruchi Singh
2026-02-01T08:53:40+05:30	love	p:+917528934713	zira
2026-02-01T08:43:46+05:30	Inder Jeet Singh	p:+918847004244	Patiala
2026-02-01T08:42:47+05:30	Harpal Singh	p:+919781128153	Valtoha
2026-02-01T08:33:21+05:30	ਲਖਵੀਰ ਕੌਰ	p:+917087067018	Bathinda
2026-01-31T21:47:57+05:30	Davinder Singh	p:+918699608713	140308
2026-01-31T21:38:05+05:30	راہول گاندھی	p:7837940750	Rahul
2026-01-31T21:31:42+05:30	Khush	p:+918146858341	Barnala
2026-01-31T21:26:21+05:30	gaganpal	p:+918427970106	Punjab
2026-01-31T21:24:32+05:30	Sukh Vinder	p:+919914150039	Moga
2026-01-31T21:13:36+05:30	ravi bhupal	p:+917009261700	Bhupal khurd, mansa
2026-01-31T21:03:09+05:30	Jashan Kataria	p:+919592316509	Faridkot
2026-01-31T21:03:07+05:30	kanu	p:+917658853077	Amritsar
2026-01-31T21:02:39+05:30	🦅_YUVI_🦅	p:+919855930830	Dera Bassi
2026-01-31T20:58:51+05:30	Prince Sharma	p:+917901950040	Malout
2026-01-31T20:39:05+05:30	Amritpal	p:+917340701262	Bathinda
2026-01-31T20:10:23+05:30	JASS	p:+919878109328	Gill Kalan
2026-01-31T20:08:29+05:30	shabir 5911.9653077220	p:+919653077220	9653077220
2026-01-31T19:48:19+05:30	Navdeep Singh	p:8847395113	Malout
2026-01-31T18:51:38+05:30	Karan	p:9877891708	Amritsar
2026-01-31T18:47:51+05:30	Diljit Sandhu	p:7717489155	Port Blairi
2026-01-31T18:07:31+05:30	Jashan Mehraj	p:+917681902054	Bathinda
`;

const TARGET_USERS = [
    { id: 'd0a31bea-8a57-4584-a119-5b8e11140dbb', name: 'Gurnam' },
    { id: '2c905da5-b711-4a9c-9045-488719248bb1', name: 'Sandeep' }
];

async function assignLeads() {
    console.log("🚀 STARTING MANUAL ASSIGNMENT...\n");

    const lines = RAW_DATA.trim().split('\n');
    let assignedCount = 0;
    let turn = 0; // 0 for Gurnam, 1 for Sandeep

    for (const line of lines) {
        if (!line.trim()) continue;

        // Extract Data
        const parts = line.split('\t');
        // Format: Date, Name, p:Phone, City
        // Adjust index if timestamp is first
        const name = parts[1]?.trim() || 'Unknown';
        const rawPhone = parts[2]?.trim() || '';
        const city = parts[3]?.trim() || '';

        const phone = rawPhone.replace(/\D/g, '').slice(-10);

        if (phone.length !== 10) {
            console.log(`❌ Skipped Invalid Phone: ${rawPhone}`);
            continue;
        }

        const user = TARGET_USERS[turn];

        // Insert
        const { error } = await supabase.from('leads').insert({
            user_id: user.id,
            assigned_to: user.id,
            name: name,
            phone: phone,
            city: city,
            status: 'Assigned',
            source: 'Manual_Msg_Assign'
        });

        if (error) {
            console.error(`❌ Failed to assign ${name} to ${user.name}: ${error.message}`);
        } else {
            console.log(`✅ Assigned: ${name.padEnd(15)} -> ${user.name}`);

            // Increment local user leads (optional logic)
            // Toggle Turn
            turn = (turn + 1) % TARGET_USERS.length;
            assignedCount++;
        }
    }

    console.log(`\n🎉 Completed. Assigned ${assignedCount} leads.`);
}

assignLeads();
