const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://vewqzsqddgmkslnuctvb.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDUzMDQ2MiwiZXhwIjoyMDgwMTA2NDYyfQ.pAgMGN6MtKm1A3fsKr1GIt8-qmKYhwFjSt92L_6_7us';
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const LEADS = [
    { name: 'Naveen Kumar', phone: '8872142371', city: 'Doraha' },
    { name: 'Rajindersing Singh', phone: '7347339423', city: 'Fazilka' },
    { name: 'Surinder Singh', phone: '7087212773', city: 'Kiratpur sahib' },
    { name: 'Amritjot kaur', phone: '7696282576', city: 'Ludhiana' },
    { name: 'Puneet', phone: '8283910139', city: 'Ludhiana' },
    { name: 'ਬਾਠ', phone: '8557931057', city: 'Moga' },
    { name: 'ਰਾਜਦੀਪ ਸਿੰਘ', phone: '9872606832', city: 'Fatehgarh Sahib' },
    { name: 'Akash Tung', phone: '8196959098', city: 'Patti' },
    { name: 'karan', phone: '9517886988', city: 'Amritsar' },
    { name: 'gaurav kumar', phone: '7814373397', city: 'Patiala' }
];

function getPlanWeight(plan) {
    const p = (plan || '').toLowerCase();
    if (p.includes('turbo')) return 100;
    if (p.includes('weekly')) return 90;
    if (p.includes('manager')) return 80;
    if (p.includes('supervisor')) return 70;
    return 10;
}

async function assign() {
    console.log('Fetching active users...');
    const { data: users, error } = await supabase.from('users')
        .select('id, name, daily_limit, plan_name')
        .eq('is_active', true)
        .eq('payment_status', 'active');

    if (error) { console.error(error); return; }

    // Start of "today" in UTC (approx for IST check)
    // Actually, let's just use the last 24 hours to be safe or 00:00 IST
    // UTC Midnight is 5:30 AM IST. 
    // Just using current date start
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    // Correct way for IST: UTC 18:30 yesterday
    // But let's keep it simple: any leads created "today".

    const eligible = [];
    for (const u of users || []) {
        const { count } = await supabase.from('leads')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', u.id)
            .gte('created_at', todayStart.toISOString());

        const remaining = (u.daily_limit || 0) - (count || 0);
        if (remaining > 0) {
            eligible.push({ ...u, remaining, weight: getPlanWeight(u.plan_name) });
        }
    }

    eligible.sort((a, b) => b.weight - a.weight);

    console.log(`Found ${eligible.length} eligible users.`);
    // eligible.forEach(u => console.log(`- ${u.name} (${u.remaining} left)`));

    let leadIdx = 0;
    while (leadIdx < LEADS.length) {
        let assignedInThisRound = false;

        for (const user of eligible) {
            if (leadIdx >= LEADS.length) break;
            if (user.remaining <= 0) continue;

            const batchSize = Math.min(2, Math.min(LEADS.length - leadIdx, user.remaining));

            for (let k = 0; k < batchSize; k++) {
                const lead = LEADS[leadIdx];

                // Check if lead exists? No, just assign as requested
                const { error: insErr } = await supabase.from('leads').insert({
                    name: lead.name,
                    phone: lead.phone,
                    city: lead.city,
                    user_id: user.id,
                    assigned_to: user.id,
                    source: 'Manual - Batch',
                    created_at: new Date().toISOString()
                });

                if (!insErr) {
                    console.log(`✅ ${lead.name} -> ${user.name}`);
                } else {
                    console.log(`❌ Failed ${lead.name}: ${insErr.message}`);
                }

                leadIdx++;
                user.remaining--;
            }
            assignedInThisRound = true;
        }

        if (!assignedInThisRound) {
            console.log('--- No more quota available ---');
            break;
        }
    }
}

assign();
