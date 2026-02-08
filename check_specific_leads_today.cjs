
const { createClient } = require('@supabase/supabase-js');
const SUPABASE_URL = 'https://vewqzsqddgmkslnuctvb.supabase.co';
const ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ1MzA0NjIsImV4cCI6MjA4MDEwNjQ2Mn0.g-e8YNzEy0Z5ul1RGAhBMDj41TtWGuNPEzZz4XEGPg4";
const supabase = createClient(SUPABASE_URL, ANON_KEY);

async function checkSpecificLeadsToday() {
    const names = ['Enquiry', 'ruchi', 'preety', 'Ravisher sandhu', 'Himanshu Success Verification', 'Himanshu Golden Verification'];
    const today = new Date().toISOString().split('T')[0];

    console.log(`🔍 Checking status of specific leads TODAY (${today}):`);

    const { data: leads, error } = await supabase
        .from('leads')
        .select('name, source, status, assigned_to, created_at')
        .in('name', names)
        .gte('created_at', today + 'T00:00:00Z')
        .order('created_at', { ascending: false });

    if (error) { console.error(error); return; }

    const userIds = [...new Set(leads.map(l => l.assigned_to).filter(id => id))];
    const { data: users } = await supabase.from('users').select('id, name, team_code').in('id', userIds);
    const userMap = users?.reduce((acc, u) => ({ ...acc, [u.id]: u }), {}) || {};

    leads.forEach(l => {
        const u = userMap[l.assigned_to];
        console.log(`Lead: ${l.name} | Assigned To: ${u ? u.name + " (" + u.team_code + ")" : "UNASSIGNED"} | Source: ${l.source}`);
    });
}

checkSpecificLeadsToday();
