
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://vewqzsqddgmkslnuctvb.supabase.co';
const SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDUzMDQ2MiwiZXhwIjoyMDgwMTA2NDYyfQ.pAgMGN6MtKm1A3fsKr1GIt8-qmKYhwFjSt92L_6_7us";

const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

async function checkNewLeads() {
    console.log("🕵️‍♂️ Checking New Leads from Chirag's Page (Feb 5)...\n");

    const today = new Date().toISOString().split('T')[0];

    // Count all leads related to Chirag today
    const { data: leads, error } = await supabase.from('leads')
        .select('*')
        .or('source.ilike.%Chirag%,source.ilike.%bhumit%')
        .gte('created_at', today + 'T00:00:00')
        .order('created_at', { ascending: false });

    if (error) return console.error(error);

    const metaLeads = leads.filter(l => l.source.includes('Meta') || l.source.includes('Copy'));
    const recoveryLeads = leads.filter(l => l.source.includes('Recovery') || l.source.includes('Sync'));
    const manualLeads = leads.filter(l => !l.source.includes('Meta') && !l.source.includes('Recovery') && !l.source.includes('Sync'));

    console.log(`📊 TOTAL CHIRAG LEADS TODAY: ${leads.length}`);
    console.log(`   - 📢 From FB Page (Direct): ${metaLeads.length}`);
    console.log(`   - 🛠️ Recovered/Synced:     ${recoveryLeads.length}`);
    console.log(`   - 📝 Manual/Other:         ${manualLeads.length}`);

    if (leads.length > 0) {
        const lastLead = leads[0];
        const lastTime = new Date(lastLead.created_at).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });
        console.log(`\n🕒 LATEST LEAD RECEIVED AT: ${lastTime}`);
        console.log(`   👤 Name: ${lastLead.name}`);
        console.log(`   📱 Source: ${lastLead.source}`);

        // Check if "Real-time" has stopped
        const diffMinutes = Math.floor((new Date() - new Date(lastLead.created_at)) / 60000);
        if (diffMinutes > 30) {
            console.log(`\n⚠️ WARNING: No new leads in the last ${diffMinutes} minutes.`);
            console.log("   (Likely due to the Expired Access Token issue).");
        } else {
            console.log(`\n✅ SYSTEM ACTIVE: New lead arrived ${diffMinutes} minutes ago.`);
        }
    }
}

checkNewLeads();
