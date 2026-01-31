const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://vewqzsqddgmkslnuctvb.supabase.co';
const ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ1MzA0NjIsImV4cCI6MjA4MDEwNjQ2Mn0.g-e8YNzEy0Z5ul1RGAhBMDj41TtWGuNPEzZz4XEGPg4";
const supabase = createClient(SUPABASE_URL, ANON_KEY);

async function checkLatestLead() {
    console.log("🔍 Checking Latest Landing Page Leads...");

    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();

    const { data: leads, error } = await supabase
        .from('leads')
        .select(`name, phone, city, notes, created_at`)
        .eq('source', 'Web Landing Page')
        .gte('created_at', todayStart)
        .order('created_at', { ascending: false });

    if (error) return console.error(error);

    console.log(`✅ Total Web Leads Today: ${leads.length}`);

    // Show the NEWEST one first
    if (leads.length > 0) {
        const newest = leads[0]; // First in list because of desc sort
        const time = new Date(newest.created_at).toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata' });

        console.log("\n🆕 NEWEST LEAD ARRIVED:");
        console.log(`👤 Name: ${newest.name}`);
        console.log(`📱 Phone: ${newest.phone}`);
        console.log(`🌍 City: ${newest.city}`);
        console.log(`📝 Info: ${newest.notes}`);
        console.log(`⏰ Time: ${time}`);
    }
}

checkLatestLead();
