const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://vewqzsqddgmkslnuctvb.supabase.co';
const ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ1MzA0NjIsImV4cCI6MjA4MDEwNjQ2Mn0.g-e8YNzEy0Z5ul1RGAhBMDj41TtWGuNPEzZz4XEGPg4";
const supabase = createClient(SUPABASE_URL, ANON_KEY);

// Raw leads data
const rawLeads = [
    { name: 'Kulwinder Singh', phone: '7347697002', city: 'Gidderbaha' },
    { name: 'GURDEEP SINGH', phone: '9465657983', city: 'Patiala' },
    { name: 'Amandeep', phone: '7814188922', city: 'Bagha Purana' },
    { name: 'Satvinder Singh Babbu', phone: '8307638605', city: 'Shahabad markanda' },
    { name: 'nahar__saab', phone: '6283180750', city: 'Moga' },
    { name: 'jaggi singh', phone: '9815487452', city: 'Mansa' },
    { name: 'Surjeet Singh Th', phone: '9876906139', city: 'Barnala' },
    { name: 'Babbu', phone: '9915380379', city: 'Malla Faridkot' }
];

async function assignLeadsToZeroCountUsers() {
    console.log("🚀 ASSIGNING 8 LEADS TO '0 LEAD' USERS...\n");

    // 1. Get Eligible Users (Zero leads today OR low leads) - IGNORING ONLINE STATUS FOR NOW
    const { data: users, error } = await supabase
        .from('users')
        .select('id, name, leads_today, daily_limit')
        .eq('is_active', true)
        .eq('payment_status', 'active')
        .neq('plan_name', 'none')
        .order('leads_today', { ascending: true }); // Prioritize 0 leads

    if (error || !users || users.length === 0) {
        console.log("❌ No eligible users found!");
        return;
    }

    // Filter strictly for 0 leads first
    let eligible = users.filter(u => u.leads_today === 0);

    // If no 0 lead users, take anyone with quota room
    if (eligible.length === 0) {
        console.log("⚠️ No 0-lead users found. Checking others with quota...");
        eligible = users.filter(u => (u.leads_today || 0) < (u.daily_limit || 0));
    }

    if (eligible.length === 0) {
        console.log("❌ No users available with remaining quota!");
        return;
    }

    console.log(`Found ${eligible.length} eligible users to receive leads.`);

    let assigned = 0;

    for (let i = 0; i < rawLeads.length; i++) {
        const lead = rawLeads[i];

        // Round-robin assignment
        const user = eligible[i % eligible.length];

        if (!user) {
            console.log("⚠️ No more users available!");
            break;
        }

        // Clean phone
        let phone = lead.phone.replace(/\D/g, '').slice(-10);
        if (phone.length < 10) phone = '0000000000';

        const { error: insertError } = await supabase
            .from('leads')
            .insert({
                name: lead.name,
                phone: phone,
                city: lead.city,
                state: 'Punjab',
                status: 'Fresh',
                source: 'Manual_Admin_8',
                user_id: user.id,
                assigned_to: user.id,
                assigned_at: new Date().toISOString(),
                created_at: new Date().toISOString()
            });

        if (insertError) {
            console.log(`❌ Failed: ${lead.name} -> ${insertError.message}`);
        } else {
            // Update User Count & Make Online (to show in dashboard)
            user.leads_today = (user.leads_today || 0) + 1;

            await supabase.from('users').update({
                leads_today: user.leads_today,
                is_online: true,
                last_active_at: new Date().toISOString()
            }).eq('id', user.id);

            console.log(`✅ ${lead.name.padEnd(20)} -> ${user.name} (Leads: ${user.leads_today})`);
            assigned++;
        }
    }

    console.log(`\n🎉 DONE! Assigned ${assigned}/${rawLeads.length} leads.`);
}

assignLeadsToZeroCountUsers();
