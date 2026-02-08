
const { createClient } = require('@supabase/supabase-js');
const SUPABASE_URL = 'https://vewqzsqddgmkslnuctvb.supabase.co';
const ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ1MzA0NjIsImV4cCI6MjA4MDEwNjQ2Mn0.g-e8YNzEy0Z5ul1RGAhBMDj41TtWGuNPEzZz4XEGPg4";
const supabase = createClient(SUPABASE_URL, ANON_KEY);

async function fixMetaPages() {
    console.log("🛠️ FIXING META PAGES TABLE (REAL INSERT)...");

    const pages = [
        { page_id: '61582413060584', page_name: 'Work With Himanshu Sharma', team_id: 'TEAMFIRE' },
        { page_id: '100064047514797', page_name: 'Rajwinder FB Page', team_id: 'TEAMRAJ' },
        { page_id: '61578124993244', page_name: 'Digital Chirag', team_id: 'GJ01TEAMFIRE' },
        { page_id: '61586060581800', page_name: 'Bhumit Godhani', team_id: 'GJ01TEAMFIRE' }
    ];

    const { data, error } = await supabase
        .from('meta_pages')
        .upsert(pages, { onConflict: 'page_id' })
        .select();

    if (error) {
        console.error("❌ INSERT FAILED:", error);
    } else {
        console.log(`✅ SUCCESS! Inserted/Updated ${data.length} pages.`);
        console.table(data);
    }
}

fixMetaPages();
