
const { createClient } = require('@supabase/supabase-js');
const SUPABASE_URL = 'https://vewqzsqddgmkslnuctvb.supabase.co';
const ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ1MzA0NjIsImV4cCI6MjA4MDEwNjQ2Mn0.g-e8YNzEy0Z5ul1RGAhBMDj41TtWGuNPEzZz4XEGPg4";
const supabase = createClient(SUPABASE_URL, ANON_KEY);

async function cleanAndDeactivate() {
    console.log("🧹 Step 1: Deactivating Chirag's Team (GJ01TEAMFIRE)...");
    const { error: deactivateError } = await supabase
        .from('users')
        .update({ is_active: false })
        .eq('team_code', 'GJ01TEAMFIRE');

    if (deactivateError) console.error("Error deactivating team:", deactivateError);
    else console.log("✅ Chirag's team deactivated.");

    console.log("🧹 Step 2: Deleting 'Unknown' and Junk leads from today...");
    const today = new Date().toISOString().split('T')[0];

    const { error: deleteError, count } = await supabase
        .from('leads')
        .delete({ count: 'exact' })
        .or('name.eq.Unknown,source.ilike.%Unknown%')
        .gte('created_at', today + 'T00:00:00Z');

    if (deleteError) console.error("Error deleting junk:", deleteError);
    else console.log(`✅ Deleted ${count} junk/unknown entries.`);

    console.log("🧹 Step 3: Verifying remaining real-time leads...");
    const { data: leads } = await supabase.from('leads').select('name, source, status').gte('created_at', today + 'T00:00:00Z');
    console.table(leads);
}

cleanAndDeactivate();
