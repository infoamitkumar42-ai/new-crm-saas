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

async function importAndAssign() {
    console.log(`🚀 Importing & Assigning ${LEADS.length} Leads...`);

    // 1. Fetch Priority Users
    // Logic: Raveena (Online) First, then High Value Plans (Manager/Weekly)
    const { data: users } = await supabase
        .from('users')
        .select('id, name, plan_name, daily_limit, leads_today, is_online')
        .eq('is_active', true)
        .neq('plan_name', 'none')
        .order('is_online', { ascending: false }) // Online First
        .order('plan_weight', { ascending: false }); // Then High Value

    if (!users || users.length === 0) return console.log("No active users found.");

    // Filter those who NEED leads
    const candidates = users.filter(u => (u.daily_limit - u.leads_today) > 0);

    if (candidates.length === 0) return console.log("Everyone's daily limit is full!");

    console.log(`🎯 Found ${candidates.length} candidates. Top: ${candidates.slice(0, 3).map(u => u.name).join(', ')}`);

    let assignedCount = 0;
    let userIndex = 0;

    for (const leadData of LEADS) {
        // Find next eligible user (Round Robinish)
        let user = candidates[userIndex];

        // Ensure user hasn't hit limit during this loop
        while (user && (user.leads_today + 1 > user.daily_limit)) {
            userIndex = (userIndex + 1) % candidates.length;
            user = candidates[userIndex];
        }

        if (!user) {
            console.log("⚠️ No more eligible users (Limits Hit). Stopping.");
            break;
        }

        // Assign
        console.log(`🔹 Assigning ${leadData.name} -> ${user.name} (${user.leads_today + 1}/${user.daily_limit})`);

        const { error } = await supabase.from('leads').insert([{
            name: leadData.name,
            phone: leadData.phone, // Phone is already cleaned in array? No, simple string.
            city: leadData.city,
            user_id: user.id,
            status: 'Assigned',
            source: 'Manual Import',
            date: new Date().toISOString()
        }]);

        if (error) {
            console.error(`❌ Error assigning to ${user.name}:`, error.message);
        } else {
            // Update Local & DB Count
            user.leads_today += 1;
            assignedCount++;

            // Update User Count in DB
            await supabase.from('users').update({
                leads_today: user.leads_today,
                total_leads_received: (user.total_leads_received || 0) + 1,
                last_lead_time: new Date().toISOString()
            }).eq('id', user.id);
        }

        // Move to next user for next lead
        userIndex = (userIndex + 1) % candidates.length;
    }

    console.log(`\n✅ Successfully Assigned ${assignedCount} / ${LEADS.length} Leads.`);
}

importAndAssign();
