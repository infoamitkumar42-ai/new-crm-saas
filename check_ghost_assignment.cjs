
const { createClient } = require('@supabase/supabase-js');
const SUPABASE_URL = 'https://vewqzsqddgmkslnuctvb.supabase.co';
const ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ1MzA0NjIsImV4cCI6MjA4MDEwNjQ2Mn0.g-e8YNzEy0Z5ul1RGAhBMDj41TtWGuNPEzZz4XEGPg4";
const supabase = createClient(SUPABASE_URL, ANON_KEY);

async function checkGhostAssignment() {
    console.log("🚀 Testing if Leads get assigned AUTOMATICALLY on insert...");

    const testLead = {
        name: 'GHOST TEST',
        phone: '1122334455',
        city: 'Ghost City',
        source: 'Ghost Source',
        status: 'New' // We insert as NEW
    };

    const { data: lead, error } = await supabase.from('leads').insert(testLead).select().single();
    if (error) { console.error("Insert Error:", error.message); return; }

    console.log(`Lead inserted with ID: ${lead.id}, Status: ${lead.status}, AssignedTo: ${lead.assigned_to}`);

    // Wait 5 seconds to see if it changes
    console.log("Waiting 5 seconds for any triggers/scripts...");
    await new Promise(r => setTimeout(r, 5000));

    const { data: updatedLead } = await supabase.from('leads').select('*').eq('id', lead.id).single();
    console.log(`Lead status after 5s: ${updatedLead.status}, AssignedTo: ${updatedLead.assigned_to}`);

    // Cleanup
    await supabase.from('leads').delete().eq('id', lead.id);
}

checkGhostAssignment();
