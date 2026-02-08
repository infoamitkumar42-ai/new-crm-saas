
const { createClient } = require('@supabase/supabase-js');
const SUPABASE_URL = 'https://vewqzsqddgmkslnuctvb.supabase.co';
const ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ1MzA0NjIsImV4cCI6MjA4MDEwNjQ2Mn0.g-e8YNzEy0Z5ul1RGAhBMDj41TtWGuNPEzZz4XEGPg4";
const supabase = createClient(SUPABASE_URL, ANON_KEY);

async function checkRecentAssignmentsDetailed() {
    const { data: leads, error } = await supabase
        .from('leads')
        .select('id, name, status, assigned_to, source, created_at')
        .gt('created_at', new Date(Date.now() - 300000).toISOString()) // last 5 mins
        .order('created_at', { ascending: false });

    if (leads && leads.length > 0) {
        leads.forEach(l => {
            console.log(`[${l.created_at}] Lead: ${l.name} | Status: ${l.status} | Source: ${l.source} | AssignedTo: ${l.assigned_to}`);
        });
    } else {
        console.log("No leads assigned in the last 5 minutes.");
    }
}

checkRecentAssignmentsDetailed();
