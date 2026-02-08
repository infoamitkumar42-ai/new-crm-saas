
const { createClient } = require('@supabase/supabase-js');
const SUPABASE_URL = 'https://vewqzsqddgmkslnuctvb.supabase.co';
const ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ1MzA0NjIsImV4cCI6MjA4MDEwNjQ2Mn0.g-e8YNzEy0Z5ul1RGAhBMDj41TtWGuNPEzZz4XEGPg4";
const supabase = createClient(SUPABASE_URL, ANON_KEY);

async function inspectVaishnavi() {
    console.log("🕵️ Inspecting Lead: VAISHNAVI");
    const { data: lead } = await supabase.from('leads').select('*').eq('name', 'VAISHNAVI').single();
    if (!lead) { console.log("Lead not found!"); return; }
    console.log(lead);

    if (lead.assigned_to) {
        const { data: user } = await supabase.from('users').select('*').eq('id', lead.assigned_to).single();
        console.log("Assigned To User:", user.name, "Email:", user.email, "TeamCode:", user.team_code);
    }
}
inspectVaishnavi();
