
const { createClient } = require('@supabase/supabase-js');
const SUPABASE_URL = 'https://vewqzsqddgmkslnuctvb.supabase.co';
const ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ1MzA0NjIsImV4cCI6MjA4MDEwNjQ2Mn0.g-e8YNzEy0Z5ul1RGAhBMDj41TtWGuNPEzZz4XEGPg4";
const supabase = createClient(SUPABASE_URL, ANON_KEY);

async function inspectRajinderLead() {
    const email = 'officialrajinderdhillon@gmail.com';
    console.log(`🔍 Checking Lead 'Enquiry' for user: ${email}`);

    // Get User ID
    const { data: user } = await supabase.from('users').select('id').eq('email', email).single();
    if (!user) { console.error("User not found"); return; }

    // Get the lead
    const { data: lead, error } = await supabase
        .from('leads')
        .select('*')
        .eq('assigned_to', user.id)
        .eq('name', 'Enquiry')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

    if (error) {
        console.error("❌ Error fetching lead:", error.message);
        return;
    }

    console.log("📄 FULL LEAD DATA:");
    console.log(JSON.stringify(lead, null, 2));
}

inspectRajinderLead();
