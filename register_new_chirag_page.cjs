
const { createClient } = require('@supabase/supabase-js');
const SUPABASE_URL = 'https://vewqzsqddgmkslnuctvb.supabase.co';
const ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ1MzA0NjIsImV4cCI6MjA4MDEwNjQ2Mn0.g-e8YNzEy0Z5ul1RGAhBMDj41TtWGuNPEzZz4XEGPg4";
const supabase = createClient(SUPABASE_URL, ANON_KEY);

async function registerNewPage() {
    const pageId = '732158063294721';
    const pageName = 'Digital Chirag (New)';
    const teamId = 'GJ01TEAMFIRE';

    console.log(`📡 Mapping Page ${pageId} to team ${teamId}...`);

    const { error } = await supabase
        .from('meta_pages')
        .upsert({ page_id: pageId, page_name: pageName, team_id: teamId }, { onConflict: 'page_id' });

    if (error) {
        console.error("❌ Error mapping page:", error.message);
    } else {
        console.log("✅ Successfully mapped! Backend is READY.");
    }
}

registerNewPage();
