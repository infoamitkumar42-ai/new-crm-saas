const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://vewqzsqddgmkslnuctvb.supabase.co';
const ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ1MzA0NjIsImV4cCI6MjA4MDEwNjQ2Mn0.g-e8YNzEy0Z5ul1RGAhBMDj41TtWGuNPEzZz4XEGPg4";
const supabase = createClient(SUPABASE_URL, ANON_KEY);

async function checkAssignedSimple() {
    const startTime = new Date();
    startTime.setHours(16, 30, 0, 0);

    // Get leads with assigned_to
    const { data: leads } = await supabase
        .from('leads')
        .select('name, assigned_to')
        .gt('created_at', startTime.toISOString())
        .eq('status', 'Assigned');

    if (leads) {
        for (const l of leads) {
            const { data: u } = await supabase.from('users').select('name').eq('id', l.assigned_to).single();
            console.log(`Lead: ${l.name} -> User: ${u ? u.name : 'Unknown ID ' + l.assigned_to}`);
        }
    }
}

checkAssignedSimple();
