
const { createClient } = require('@supabase/supabase-js');
const SUPABASE_URL = 'https://vewqzsqddgmkslnuctvb.supabase.co';
const ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ1MzA0NjIsImV4cCI6MjA4MDEwNjQ2Mn0.g-e8YNzEy0Z5ul1RGAhBMDj41TtWGuNPEzZz4XEGPg4";
const supabase = createClient(SUPABASE_URL, ANON_KEY);

async function checkTriggers() {
    const { data, error } = await supabase.rpc('get_triggers', { table_val: 'leads' });
    if (error) {
        // Fallback to direct SQL if RPC doesn't exist
        const sql = `
            SELECT 
                trigger_name, 
                event_manipulation, 
                action_statement, 
                action_timing 
            FROM information_schema.triggers 
            WHERE event_object_table = 'leads';
        `;
        console.log("RPC failed, trying query via another method...");
        // I don't have a direct 'sql' tool, so I'll try to find any existing SQL execution functions.
    } else {
        console.log("Triggers:", data);
    }
}

// Since I can't easily see Triggers via standard JS client without an RPC, 
// I'll check if there's any 'on-create' edge function or something.
// But wait, I have the 'run_command' tool! I can use it to check for triggers if I have psql, 
// but I don't. 

// Let's check the code of the webhook again. 
// Maybe the user is seeing leads assigned to Sumit because they are being created BY A DIFFERENT WEBHOOK.
// The user said: "Enquiry and ruchi ... ye himanshu ki team ko assign honey chaiye".
// In my audit, they ARE assigned to Himanshu's team.

// If the user still sees 2 on Sumit's dashboard, it means:
// 1. Either the dashboard shows old leads (not just today).
// 2. Or the 'leads_today' column on Sumit's user record is still 2.

async function checkSumitLeadConnections() {
    const { data: sumit } = await supabase.from('users').select('id, name, leads_today').eq('email', 'sumitbambhaniya024@gmail.com').single();
    if (!sumit) return;

    const { data: leads } = await supabase.from('leads').select('name, status, assigned_to').eq('assigned_to', sumit.id);

    console.log(`Sumit Total Leads in DB (all time): ${leads?.length || 0}`);
    console.log(`Sumit leads_today column: ${sumit.leads_today}`);
    console.log(`Recent leads for Sumit:`, leads?.slice(-5));
}

checkSumitLeadConnections();
