
const { createClient } = require('@supabase/supabase-js');
const SUPABASE_URL = 'https://vewqzsqddgmkslnuctvb.supabase.co';
const ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ1MzA0NjIsImV4cCI6MjA4MDEwNjQ2Mn0.g-e8YNzEy0Z5ul1RGAhBMDj41TtWGuNPEzZz4XEGPg4";
const supabase = createClient(SUPABASE_URL, ANON_KEY);

async function finalCleanupAndCheck() {
    const today = new Date().toISOString().split('T')[0];

    // 1. Delete all 'Unknown' leads
    const { error: delError } = await supabase
        .from('leads')
        .delete()
        .or('name.eq.Unknown,source.ilike.%Unknown%')
        .gte('created_at', today + 'T00:00:00Z');

    if (delError) console.error("Delete Error:", delError);

    // 2. Count remaining
    const { count } = await supabase
        .from('leads')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', today + 'T00:00:00Z');

    console.log(`Final Real Lead Count in DB: ${count}`);
}

finalCleanupAndCheck();
