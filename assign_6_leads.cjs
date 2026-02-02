const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://vewqzsqddgmkslnuctvb.supabase.co';
const ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ1MzA0NjIsImV4cCI6MjA4MDEwNjQ2Mn0.g-e8YNzEy0Z5ul1RGAhBMDj41TtWGuNPEzZz4XEGPg4";
const supabase = createClient(SUPABASE_URL, ANON_KEY);

// Leads to assign
const leads = [
    { name: 'Jass', phone: '7347311859', city: 'Fazilka' },
    { name: 'Ashish goyal', phone: '9878251856', city: 'Ashish Goyal' },
    { name: 'Jarman singh', phone: '9876747415', city: 'Batala' },
    { name: 'Palpreet Sandhu', phone: '7340851994', city: 'Tarn taran' },
    { name: 'Gurlal Sandhu', phone: '8968804288', city: 'Goindwal Sahib' },
    { name: 'Dolly', phone: '6284516203', city: 'Jalandhar' }
];

async function assignLeads() {
    console.log("🚀 ASSIGNING 6 LEADS TO ACTIVE USERS (1 each)...\n");

    // Get eligible users (online, active, with room)
    const { data: users } = await supabase
        .from('users')
        .select('id, name, daily_limit, leads_today')
        .eq('is_online', true)
        .eq('is_active', true)
        .eq('payment_status', 'active')
        .neq('plan_name', 'none')
        .order('leads_today', { ascending: true })
        .limit(20);

    if (!users || users.length === 0) {
        console.log("❌ No eligible users found!");
        return;
    }

    // Filter users who have room
    const eligible = users.filter(u => (u.leads_today || 0) < (u.daily_limit || 0));

    if (eligible.length < leads.length) {
        console.log(`⚠️ Only ${eligible.length} users have room. Proceeding with available...`);
    }

    console.log(`Found ${eligible.length} eligible users. Assigning ${leads.length} leads...\n`);

    let assigned = 0;
    for (let i = 0; i < leads.length; i++) {
        const lead = leads[i];
        const user = eligible[i % eligible.length];

        // Clean phone
        const phone = lead.phone.replace(/\D/g, '').slice(-10);

        const { error } = await supabase
            .from('leads')
            .insert({
                name: lead.name,
                phone: phone,
                city: lead.city,
                state: 'Punjab',
                status: 'Fresh',
                source: 'Manual_Admin',
                user_id: user.id,
                assigned_to: user.id,
                assigned_at: new Date().toISOString(),
                created_at: new Date().toISOString()
            });

        if (error) {
            console.log(`❌ Failed: ${lead.name} -> ${error.message}`);
        } else {
            console.log(`✅ ${lead.name} (${phone}) -> ${user.name}`);
            assigned++;
        }
    }

    console.log(`\n🎉 DONE! Assigned ${assigned}/${leads.length} leads.`);
}

assignLeads();
