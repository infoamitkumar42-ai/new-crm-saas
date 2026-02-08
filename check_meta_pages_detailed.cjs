
const { createClient } = require('@supabase/supabase-js');
const SUPABASE_URL = 'https://vewqzsqddgmkslnuctvb.supabase.co';
const ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ1MzA0NjIsImV4cCI6MjA4MDEwNjQ2Mn0.g-e8YNzEy0Z5ul1RGAhBMDj41TtWGuNPEzZz4XEGPg4";
const supabase = createClient(SUPABASE_URL, ANON_KEY);

async function checkMetaPagesDetailed() {
    console.log("📄 Meta Pages Table Content:");
    const { data: pages, error } = await supabase
        .from('meta_pages')
        .select('*');

    if (error) {
        console.error("❌ Error fetching meta_pages:", error);
        return;
    }

    if (!pages || pages.length === 0) {
        console.log("📭 Table is EMPTY.");
    } else {
        pages.forEach(p => {
            console.log(`PageID: ${p.page_id} | Name: ${p.page_name} | Team: ${p.team_id}`);
        });
    }
}

checkMetaPagesDetailed();
