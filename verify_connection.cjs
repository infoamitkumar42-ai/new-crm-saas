
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://vewqzsqddgmkslnuctvb.supabase.co';
const SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDUzMDQ2MiwiZXhwIjoyMDgwMTA2NDYyfQ.pAgMGN6MtKm1A3fsKr1GIt8-qmKYhwFjSt92L_6_7us";

const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

async function verifyConnection() {
    console.log("📡 Checking System Connections...");

    // 1. Get Chirag Page Config
    const { data: page, error } = await supabase
        .from('meta_pages')
        .select('*')
        .eq('page_name', 'Digital Chirag')
        .single();

    if (error || !page) {
        console.error("❌ 'Digital Chirag' page config NOT FOUND in Database.");
        return;
    }

    console.log("✅ Page Config Found:", page.page_name, `(ID: ${page.page_id})`);

    if (!page.access_token) {
        console.error("❌ Access Token is MISSING in Database!");
        return;
    }

    console.log("✅ Access Token Present (Ends with: ...", page.access_token.slice(-10), ")");

    // 2. Test Token Validity with Facebook Graph API
    console.log("🌐 Pinging Facebook Graph API to validate token...");

    try {
        const url = `https://graph.facebook.com/me?access_token=${page.access_token}`;
        const res = await fetch(url);
        const json = await res.json();

        if (json.error) {
            console.error("❌ Connection FAILED. Token Invalid:", json.error.message);
        } else if (json.id === page.page_id) {
            console.log("✅ Connection VERIFIED! Token works and matches Page ID.");
            console.log("🟢 SYSTEM IS ONLINE & READY.");
        } else {
            console.log("⚠️ Connection Warning: Token valid but ID mismatch?");
            console.log(`Expected: ${page.page_id}, Got: ${json.id}`);
        }
    } catch (e) {
        console.error("❌ Network Error during verify:", e.message);
    }
}

verifyConnection();
