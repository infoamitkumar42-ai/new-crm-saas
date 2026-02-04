const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://vewqzsqddgmkslnuctvb.supabase.co';
const ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ1MzA0NjIsImV4cCI6MjA4MDEwNjQ2Mn0.g-e8YNzEy0Z5ul1RGAhBMDj41TtWGuNPEzZz4XEGPg4";
const supabase = createClient(SUPABASE_URL, ANON_KEY);

async function findTables() {
    console.log("🔍 Checking ALL tables in public schema...\n");

    // We can't query information_schema directly via JS client easily without RLS policies usually, 
    // but let's try a different approach: Inspecting a known related table or guessing common names.

    // Attempt 1: Check 'pages'
    const { error: err1 } = await supabase.from('pages').select('id').limit(1);
    if (!err1) console.log("✅ Table 'pages' EXISTS.");

    // Attempt 2: Check 'facebook_pages'
    const { error: err2 } = await supabase.from('facebook_pages').select('id').limit(1);
    if (!err2) console.log("✅ Table 'facebook_pages' EXISTS.");

    // Attempt 3: Check 'page_settings'
    const { error: err3 } = await supabase.from('page_settings').select('id').limit(1);
    if (!err3) console.log("✅ Table 'page_settings' EXISTS.");

    // Attempt 4: Check 'meta_integrations'
    const { error: err4 } = await supabase.from('meta_integrations').select('id').limit(1);
    if (!err4) console.log("✅ Table 'meta_integrations' EXISTS.");

    // If all fail, maybe we should create it?
}

findTables();
