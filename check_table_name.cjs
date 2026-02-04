const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://vewqzsqddgmkslnuctvb.supabase.co';
const ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ1MzA0NjIsImV4cCI6MjA4MDEwNjQ2Mn0.g-e8YNzEy0Z5ul1RGAhBMDj41TtWGuNPEzZz4XEGPg4";
const supabase = createClient(SUPABASE_URL, ANON_KEY);

async function listTables() {
    console.log("🔍 Checking 'meta_pages' table existence...\n");

    // Try to select from meta_pages
    const { data, error } = await supabase.from('meta_pages').select('*').limit(1);

    if (error) {
        console.log(`❌ Error selecting from 'meta_pages': ${error.message}`);
        console.log("Details: Table might be named differently (e.g., 'facebook_pages', 'pages').");
    } else {
        console.log("✅ 'meta_pages' exists and is accessible via API.");
    }
}

listTables();
