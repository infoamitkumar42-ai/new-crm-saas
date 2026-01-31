const { createClient } = require('@supabase/supabase-js');

// Config
const SUPABASE_URL = 'https://vewqzsqddgmkslnuctvb.supabase.co';
const ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ1MzA0NjIsImV4cCI6MjA4MDEwNjQ2Mn0.g-e8YNzEy0Z5ul1RGAhBMDj41TtWGuNPEzZz4XEGPg4";

const supabase = createClient(SUPABASE_URL, ANON_KEY);

async function checkPradeepLeadSource() {
    console.log("🔍 Analyzing Lead Source for Pradeep...");

    // 1. Get User ID
    const { data: user } = await supabase.from('users').select('id').eq('email', 'pradeepleads@gmail.com').single();
    if (!user) { console.log("User not found"); return; }

    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();

    // 2. Fetch Leads
    const { data: leads, error } = await supabase
        .from('leads')
        .select('created_at, source, notes, status')
        .eq('user_id', user.id)
        .gte('created_at', todayStart)
        .order('created_at', { ascending: true }); // Show sequence

    if (error) { console.error(error); return; }

    console.log(`\n📋 Detail Report (Total: ${leads.length}):`);
    leads.forEach((l, index) => {
        const time = new Date(l.created_at).toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata' });
        console.log(`${index + 1}. Time: ${time} | Source: ${l.source} | Status: ${l.status}`);
    });
}

checkPradeepLeadSource();
