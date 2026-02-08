
const { createClient } = require('@supabase/supabase-js');
const SUPABASE_URL = 'https://vewqzsqddgmkslnuctvb.supabase.co';
const ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ1MzA0NjIsImV4cCI6MjA4MDEwNjQ2Mn0.g-e8YNzEy0Z5ul1RGAhBMDj41TtWGuNPEzZz4XEGPg4";
const supabase = createClient(SUPABASE_URL, ANON_KEY);

async function checkTriggers() {
    const { data, error } = await supabase.from('leads').select('*').limit(1);
    // We can't query information_schema via anon key usually.
    // Let's check for any leads assigned RECENTLY that were NOT assigned by the webhook.
    // The webhook sets status='Assigned'. 

    console.log("Checking leads assigned in the last 2 minutes...");
    const { data: leads } = await supabase.from('leads').select('*').gt('created_at', new Date(Date.now() - 120000).toISOString());
    console.table(leads);
}

checkTriggers();
