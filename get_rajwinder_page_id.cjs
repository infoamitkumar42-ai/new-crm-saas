
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://vewqzsqddgmkslnuctvb.supabase.co';
const SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDUzMDQ2MiwiZXhwIjoyMDgwMTA2NDYyfQ.pAgMGN6MtKm1A3fsKr1GIt8-qmKYhwFjSt92L_6_7us";

const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

async function checkRajwinderPage() {
    console.log("🔍 Searching for Rajwinder's Page ID...");

    // 1. First find Rajwinder's User ID
    const { data: user } = await supabase.from('users')
        .select('id, name')
        .ilike('name', '%Rajwinder%')
        .single();

    if (!user) {
        console.log("❌ User 'Rajwinder' not found.");
        return;
    }

    console.log(`👤 Found User: ${user.name} (ID: ${user.id})`);

    // 2. Find Connected Page where Manager = Rajwinder
    const { data: page } = await supabase.from('connected_pages')
        .select('*')
        .eq('manager_id', user.id)
        .single();

    if (page) {
        console.log(`\n✅ FOUND PAGE!`);
        console.log(`-----------------------------------`);
        console.log(`📄 Page Name:   ${page.page_name}`);
        console.log(`🆔 Page ID:     ${page.page_id}`);
        console.log(`🔑 Access Token: ${page.access_token ? 'Present (Hidden)' : 'MISSING'}`);
        console.log(`🟢 Active:      ${page.is_active}`);
        console.log(`-----------------------------------`);
    } else {
        console.log("❌ No page explicitly linked to this Manager.");

        // 3. Fallback: Search all pages
        console.log("🔄 Listing ALL pages to find manually...");
        const { data: allPages } = await supabase.from('connected_pages').select('page_name, page_id, manager_id');
        console.table(allPages);
    }
}

checkRajwinderPage();
