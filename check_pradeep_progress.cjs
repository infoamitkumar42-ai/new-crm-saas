const { createClient } = require('@supabase/supabase-js');

// Config
const SUPABASE_URL = 'https://vewqzsqddgmkslnuctvb.supabase.co';
const ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ1MzA0NjIsImV4cCI6MjA4MDEwNjQ2Mn0.g-e8YNzEy0Z5ul1RGAhBMDj41TtWGuNPEzZz4XEGPg4";

const supabase = createClient(SUPABASE_URL, ANON_KEY);

async function checkPradeepProgress() {
    console.log("🔍 Analyzing Pradeep's Work Progress (Today)...");

    const { data: user } = await supabase.from('users').select('id').eq('email', 'pradeepleads@gmail.com').single();
    if (!user) return;

    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();

    const { data: leads, error } = await supabase
        .from('leads')
        .select('name, phone, status, updated_at')
        .eq('user_id', user.id)
        .gte('created_at', todayStart);

    if (error) { console.error(error); return; }

    const worked = leads.filter(l => l.status !== 'Fresh' && l.status !== 'New');
    const pending = leads.filter(l => l.status === 'Fresh' || l.status === 'New');

    console.log(`\n📊 Summary:`);
    console.log(`✅ Total Leads: ${leads.length}`);
    console.log(`📞 Worked/Called: ${worked.length}`);
    console.log(`⏳ Pending/Unread: ${pending.length}`);

    if (worked.length > 0) {
        console.log(`\n🟢 Work Done (Statuses):`);
        worked.forEach(l => console.log(`- ${l.name}: ${l.status}`));
    }

    if (pending.length > 0) {
        console.log(`\n🔴 Pending (Not Touched):`);
        pending.forEach(l => console.log(`- ${l.name}: ${l.status}`));
    }
}

checkPradeepProgress();
