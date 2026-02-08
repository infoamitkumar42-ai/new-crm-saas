
const { createClient } = require('@supabase/supabase-js');
const SUPABASE_URL = 'https://vewqzsqddgmkslnuctvb.supabase.co';
const ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ1MzA0NjIsImV4cCI6MjA4MDEwNjQ2Mn0.g-e8YNzEy0Z5ul1RGAhBMDj41TtWGuNPEzZz4XEGPg4";
const supabase = createClient(SUPABASE_URL, ANON_KEY);

async function checkNewPageId() {
    const pageId = '732158063294721';
    console.log(`🔍 Checking if Page ID ${pageId} exists in meta_pages...`);

    const { data, error } = await supabase
        .from('meta_pages')
        .select('*')
        .eq('page_id', pageId)
        .single();

    if (error) {
        console.log("❌ Page ID not found in mapping table.");
    } else {
        console.log("✅ Page ID found:", data);
    }
}

checkNewPageId();
