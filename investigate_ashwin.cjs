
const { createClient } = require('@supabase/supabase-js');
const SUPABASE_URL = 'https://vewqzsqddgmkslnuctvb.supabase.co';
const ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ1MzA0NjIsImV4cCI6MjA4MDEwNjQ2Mn0.g-e8YNzEy0Z5ul1RGAhBMDj41TtWGuNPEzZz4XEGPg4";
const supabase = createClient(SUPABASE_URL, ANON_KEY);

async function checkAshwinLead() {
    console.log("🕵️ CHECKING LEAD FOR ASHWIN (jogadiyaashwin61@gmail.com)...");

    // 1. Get User ID
    const { data: user } = await supabase.from('users').select('id, name').eq('email', 'jogadiyaashwin61@gmail.com').single();

    if (!user) { console.log("User not found!"); return; }

    // 2. Get Last Assigned Lead
    const { data: leads } = await supabase
        .from('leads')
        .select('id, name, created_at, assigned_at, source, status')
        .eq('assigned_to', user.id)
        .order('assigned_at', { ascending: false })
        .limit(1);

    if (leads && leads.length > 0) {
        const lead = leads[0];
        console.log("📝 LAST LEAD DETAILS:");
        console.log(`   - Name: ${lead.name}`);
        console.log(`   - Source: ${lead.source}`);
        console.log(`   - Status: ${lead.status}`);
        console.log(`   - Lead Created At (FB Time): ${new Date(lead.created_at).toLocaleString('en-IN')}`);
        console.log(`   - Assigned At (System Time): ${new Date(lead.assigned_at).toLocaleString('en-IN')}`);

        const diffMs = new Date(lead.assigned_at) - new Date(lead.created_at);
        const diffMins = Math.floor(diffMs / 60000);
        console.log(`   - Delay: ${diffMins} minutes`);

        if (diffMins > 60) {
            console.log("⚠️ This lead is OLD (Backlog). It was created long before assignment.");
        } else {
            console.log("✅ This is a FRESH lead (Instant Assignment).");
        }
    } else {
        console.log("No leads found assigned to this user.");
    }
}

checkAshwinLead();
