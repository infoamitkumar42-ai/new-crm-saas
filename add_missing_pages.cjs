const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://vewqzsqddgmkslnuctvb.supabase.co';
const ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ1MzA0NjIsImV4cCI6MjA4MDEwNjQ2Mn0.g-e8YNzEy0Z5ul1RGAhBMDj41TtWGuNPEzZz4XEGPg4";

const supabase = createClient(SUPABASE_URL, ANON_KEY);

async function addMissingPages() {
    console.log('📝 Adding missing pages to meta_pages...\n');

    const pagesToAdd = [
        { page_id: '100895028112372', page_name: 'Rajwinder FB Page 2', team_id: 'TEAMRAJ' },
        { page_id: '901700013018340', page_name: 'Work With Himanshu Sharma 2', team_id: 'TEAMFIRE' }
    ];

    for (const page of pagesToAdd) {
        const { error } = await supabase
            .from('meta_pages')
            .upsert(page, { onConflict: 'page_id' });

        if (error) {
            console.log(`❌ Error adding ${page.page_name}: ${error.message}`);
        } else {
            console.log(`✅ Added: ${page.page_name} (${page.page_id}) → ${page.team_id}`);
        }
    }

    // Verify
    console.log('\n📋 All pages now:');
    const { data: pages } = await supabase
        .from('meta_pages')
        .select('page_id, page_name, team_id');

    if (pages) {
        pages.forEach(p => console.log(`  ${p.page_name}: ${p.page_id} → ${p.team_id}`));
    }
}

addMissingPages();
