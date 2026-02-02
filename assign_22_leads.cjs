const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://vewqzsqddgmkslnuctvb.supabase.co';
const ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ1MzA0NjIsImV4cCI6MjA4MDEwNjQ2Mn0.g-e8YNzEy0Z5ul1RGAhBMDj41TtWGuNPEzZz4XEGPg4";
const supabase = createClient(SUPABASE_URL, ANON_KEY);

// Raw leads data
const rawLeads = [
    { name: 'Akasdeep Singh', phone: '9878661417', city: 'Muktsar' },
    { name: 'Ranjit Singh Singh', phone: '9896765721', city: 'Pinjore' },
    { name: 'Harman_ਬੱਲ', phone: '8837688968', city: 'Amritsar' },
    { name: 'Komal', phone: '8289072956', city: 'Rupnagar' },
    { name: 'S.U.N.N.Y...T.U.N.G.', phone: '7973008793', city: 'Amritsar' },
    { name: 'Gurwinder Shergill', phone: '8146008037', city: 'Tarn Taran' },
    { name: 'Jaideep singh', phone: '7009299842', city: 'Faridkot' },
    { name: 'Gill_saab', phone: '9780647051', city: 'Amritsar jandiala guru' },
    { name: 'dhillo sab', phone: '9041424982', city: 'Dausy' },
    { name: 'Parvinder singh', phone: '7814053302', city: 'Romana albel Singh' },
    { name: 'Navi', phone: '9915543547', city: 'Gurdaspur' },
    { name: '666', phone: '9878310793', city: 'Jharon' },
    { name: 'ਕੱਚੇ ਘਰਾਂ ਵਾਲੇ', phone: '7710669181', city: 'Fazilka' },
    { name: 'Ankush Chhabra', phone: '9779778878', city: '1997' },
    { name: 'Sunny Dhillon', phone: '9463902623', city: 'Fajilka' },
    { name: 'Nandani', phone: '8284882411', city: 'Bareta' },
    { name: 'Sonia Jarial', phone: '8360897519', city: 'Himachal' },
    { name: 'Sahil paniar wala', phone: '9915909307', city: 'Paniar Dinanagar Gurdaspur' },
    { name: 'Ramandeep', phone: '7009332139', city: 'Moga' },
    { name: 'Sunny Pal', phone: '7710773823', city: 'Gurdaspur' },
    { name: '♤ ＳＡＮＪＵ ♤', phone: '6284259636', city: 'Gurdaspur' },
    { name: 'shivraj sandhu', phone: '6284770273', city: 'makhu' }
];

async function assignLeadsToZeroCountUsers() {
    console.log("🚀 ASSIGNING 22 LEADS TO USERS WITH 0 LEADS FIRST...\n");

    // 1. Get eligible users - prioritize those with 0 leads
    const { data: users, error } = await supabase
        .from('users')
        .select('id, name, leads_today, daily_limit')
        .eq('is_online', true)
        .eq('is_active', true)
        .eq('payment_status', 'active')
        .neq('plan_name', 'none')
        .order('leads_today', { ascending: true }); // Lowest leads first (0)

    if (error || !users || users.length === 0) {
        console.log("❌ No eligible users found!");
        return;
    }

    // Filter users who have room
    const eligible = users.filter(u => (u.leads_today || 0) < (u.daily_limit || 0));

    console.log(`Found ${eligible.length} eligible users.`);
    console.log(`Zero Lead Users: ${eligible.filter(u => u.leads_today === 0).length}`);

    let assigned = 0;

    for (let i = 0; i < rawLeads.length; i++) {
        const lead = rawLeads[i];

        // Pick user round-robin from eligible list
        // Since list is sorted by leads_today asc, it will naturally pick 0 ones first
        const user = eligible[i % eligible.length];

        if (!user) {
            console.log("⚠️ No more users with quota available!");
            break;
        }

        // Clean phone
        let phone = lead.phone.replace(/\D/g, '').slice(-10);
        if (phone.length < 10) phone = '0000000000'; // Fallback

        const { error: insertError } = await supabase
            .from('leads')
            .insert({
                name: lead.name,
                phone: phone,
                city: lead.city,
                state: 'Punjab',
                status: 'Fresh',
                source: 'Manual_Admin_22',
                user_id: user.id,
                assigned_to: user.id,
                assigned_at: new Date().toISOString(),
                created_at: new Date().toISOString()
            });

        if (insertError) {
            console.log(`❌ Failed: ${lead.name} -> ${insertError.message}`);
        } else {
            console.log(`✅ ${lead.name.padEnd(20)} -> ${user.name} (Leads Today: ${user.leads_today})`);

            // Update local counter to keep distribution fair in this loop
            user.leads_today++;

            // Only update DB every 5 leads or at end to speed up
            await supabase.from('users').update({ leads_today: user.leads_today }).eq('id', user.id);

            assigned++;
        }
    }

    console.log(`\n🎉 DONE! Assigned ${assigned}/${rawLeads.length} leads.`);
}

assignLeadsToZeroCountUsers();
