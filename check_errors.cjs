const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://vewqzsqddgmkslnuctvb.supabase.co';
const ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ1MzA0NjIsImV4cCI6MjA4MDEwNjQ2Mn0.g-e8YNzEy0Z5ul1RGAhBMDj41TtWGuNPEzZz4XEGPg4";

const supabase = createClient(SUPABASE_URL, ANON_KEY);

async function checkErrors() {
    console.log('🔍 CHECKING WEBHOOK ERRORS TABLE...\n');

    const { data: errors, error } = await supabase
        .from('webhook_errors')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);

    if (error) {
        console.log('Error:', error.message);
        return;
    }

    if (!errors || errors.length === 0) {
        console.log('✅ No errors logged.');
    } else {
        console.log(`⚠️ Found ${errors.length} errors:\n`);
        errors.forEach(e => {
            console.log(`[${new Date(e.created_at).toLocaleString('en-IN')}]`);
            console.log(`  Type: ${e.error_type}`);
            console.log(`  Details: ${JSON.stringify(e.details, null, 2)}`);
            console.log('---');
        });
    }

    // Check meta_pages
    console.log('\n\n🔍 CHECKING META_PAGES...\n');
    const { data: pages } = await supabase
        .from('meta_pages')
        .select('page_id, page_name, team_id')
        .limit(10);

    if (pages && pages.length > 0) {
        console.log('Pages configured:');
        pages.forEach(p => console.log(`  ${p.page_name}: ${p.page_id} → Team: ${p.team_id || 'NOT SET'}`));
    } else {
        console.log('❌ No meta_pages found!');
    }
}

checkErrors();
