const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = "https://vewqzsqddgmkslnuctvb.supabase.co";
const SUPABASE_SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDUzMDQ2MiwiZXhwIjoyMDgwMTA2NDYyfQ.pAgMGN6MtKm1A3fsKr1GIt8-qmKYhwFjSt92L_6_7us";

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function checkSpecificPage() {
    const pageId = '61587577081326';
    console.log(`🔍 Checking Page for ID: ${pageId}...`);

    // Try to find the page by page_id column
    const { data: page, error } = await supabase
        .from('meta_pages')
        .select('*')
        .eq('page_id', pageId)
        .single();

    if (error || !page) {
        console.error("❌ Page lookup failed:", error);

        // Try by 'id' just in case
        const { data: pageById } = await supabase.from('meta_pages').select('*').eq('id', pageId).single();
        if (pageById) {
            console.log("✅ Found by internal ID!", pageById);
            return;
        }
        return;
    }

    console.log("📄 Page Details:", page);

    // Get Owner Name
    if (page.user_id) {
        const { data: user } = await supabase
            .from('users')
            .select('name, email')
            .eq('id', page.user_id)
            .single();

        if (user) {
            console.log(`👤 OWNER: ${user.name} (${user.email})`);
        } else {
            console.log("❓ User not found for ID:", page.user_id);
        }
    } else {
        console.log("⚠️ No user_id linked to this page.");
    }
}

checkSpecificPage();
