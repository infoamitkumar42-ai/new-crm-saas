const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://vewqzsqddgmkslnuctvb.supabase.co';
const ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ1MzA0NjIsImV4cCI6MjA4MDEwNjQ2Mn0.g-e8YNzEy0Z5ul1RGAhBMDj41TtWGuNPEzZz4XEGPg4";
const supabase = createClient(SUPABASE_URL, ANON_KEY);

const ID = 'e47bb0a8-61de-4cac-8cf1-75048f0383a6';

async function lockRajwinder() {
    console.log("🔒 LOCKING RAJWINDER...");
    const { data: user } = await supabase.from('users').select('leads_today').eq('id', ID).single();
    if (user) {
        // Update Limit = Leads Today
        await supabase.from('users').update({ daily_limit: user.leads_today || 10 }).eq('id', ID);
        console.log(`✅ Locked at ${user.leads_today || 10} leads.`);
    }
}
lockRajwinder();
