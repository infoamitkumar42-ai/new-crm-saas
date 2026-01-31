const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://vewqzsqddgmkslnuctvb.supabase.co';
const ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ1MzA0NjIsImV4cCI6MjA4MDEwNjQ2Mn0.g-e8YNzEy0Z5ul1RGAhBMDj41TtWGuNPEzZz4XEGPg4";
const supabase = createClient(SUPABASE_URL, ANON_KEY);

async function getLeadDetails() {
    console.log("🔍 Fetching Full Details for Landing Page Leads...");

    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();

    const { data: leads, error } = await supabase
        .from('leads')
        .select(`
            name, 
            phone, 
            city, 
            notes, 
            created_at,
            users (name)
        `)
        .eq('source', 'Web Landing Page')
        .gte('created_at', todayStart)
        .order('created_at', { ascending: false });

    if (error) return console.error(error);

    console.log(`\n📋 Detail Report (${leads.length} Leads):`);

    leads.forEach((l, i) => {
        const time = new Date(l.created_at).toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata' });
        const assignedTo = l.users ? l.users.name : "Unassigned";

        console.log(`\n------------------------------------------------`);
        console.log(`👤 LEAD #${i + 1}: ${l.name}`);
        console.log(`📱 Phone: ${l.phone}`);
        console.log(`🌍 City: ${l.city || 'N/A'}`);
        console.log(`📝 Details: ${l.notes || 'No extra info'}`);
        console.log(`👮 Assigned To: ${assignedTo}`);
        console.log(`⏰ Time: ${time}`);
    });
}

getLeadDetails();
