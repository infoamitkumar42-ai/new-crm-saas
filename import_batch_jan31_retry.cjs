const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://vewqzsqddgmkslnuctvb.supabase.co';
const ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ1MzA0NjIsImV4cCI6MjA4MDEwNjQ2Mn0.g-e8YNzEy0Z5ul1RGAhBMDj41TtWGuNPEzZz4XEGPg4";
const supabase = createClient(SUPABASE_URL, ANON_KEY);

const LEADS = [
    { name: "nishan sandhu", phone: "9592418857", city: "Batala" },
    { name: "Harshpreet", phone: "7087173824", city: "Ferozepur" },
    { name: "Khan Saab Khan Saab", phone: "8727827486", city: "Sunam" },
    { name: "khushi77", phone: "9855204977", city: "Bathinda" },
    { name: "sad love sidhu", phone: "6280973735", city: "Amritsar" },
    { name: "Lakhwinder Kaur", phone: "8146068039", city: "Musaffah" },
    { name: "Poonam", phone: "8360671442", city: "Amritsar" }
];

async function importAndAssignRetry() {
    console.log(`🚀 Retrying Import & Assigning ${LEADS.length} Leads...`);

    const { data: users } = await supabase
        .from('users')
        .select('*') // Get everything to be safe
        .eq('is_active', true)
        .neq('plan_name', 'none')
        .order('is_online', { ascending: false })
        .order('plan_weight', { ascending: false });

    if (!users || users.length === 0) return console.log("No active users found.");

    const candidates = users.filter(u => (u.daily_limit - u.leads_today) > 0);
    console.log(`🎯 Found ${candidates.length} candidates.`);

    let assignedCount = 0;
    let userIndex = 0;

    for (const leadData of LEADS) {
        let user = candidates[userIndex];

        while (user && (user.leads_today + 1 > user.daily_limit)) {
            userIndex = (userIndex + 1) % candidates.length;
            user = candidates[userIndex];
        }

        if (!user) break;

        console.log(`🔹 Assigning ${leadData.name} -> ${user.name}`);

        const { error } = await supabase.from('leads').insert([{
            name: leadData.name,
            phone: leadData.phone,
            city: leadData.city,
            user_id: user.id,
            status: 'Assigned',
            source: 'Manual Import',
            // created_at is automatic
        }]);

        if (error) {
            console.error(`❌ Error assigning to ${user.name}:`, error.message);
        } else {
            user.leads_today += 1;
            assignedCount++;

            // Fetch fresh total to avoid overwrite bugs? No, just +1
            const newTotal = (user.total_leads_received || 0) + 1;

            await supabase.from('users').update({
                leads_today: user.leads_today,
                total_leads_received: newTotal,
                last_lead_time: new Date().toISOString()
            }).eq('id', user.id);
        }

        userIndex = (userIndex + 1) % candidates.length;
    }

    console.log(`\n✅ Successfully Assigned ${assignedCount} / ${LEADS.length} Leads.`);
}

importAndAssignRetry();
