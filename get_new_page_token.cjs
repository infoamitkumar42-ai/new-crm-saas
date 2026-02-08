
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://vewqzsqddgmkslnuctvb.supabase.co';
const SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDUzMDQ2MiwiZXhwIjoyMDgwMTA2NDYyfQ.pAgMGN6MtKm1A3fsKr1GIt8-qmKYhwFjSt92L_6_7us";

const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

const PAGE_ID = '928347267036761'; // Digital Chirag

async function fetchTokenFromDB() {
    console.log("🔑 FETCHING LATEST PAGE TOKEN FROM DB...");

    const { data: page } = await supabase.from('meta_pages')
        .select('access_token')
        .eq('page_id', PAGE_ID)
        .single();

    if (page && page.access_token) {
        console.log("✅ Found Token in DB. Verifying...");

        // Test Token
        const testUrl = `https://graph.facebook.com/me?access_token=${page.access_token}`;
        const res = await fetch(testUrl);
        const json = await res.json();

        if (json.error) {
            console.error("❌ DB Token is EXPIRED/INVALID:", json.error.message);
            console.log("👉 Please provide a NEW USER ACCESS TOKEN to generate a fresh Page Token.");
        } else {
            console.log("✅ Token is VALID! Use this one.");
            console.log("Token:", page.access_token);
        }
    } else {
        console.log("❌ No token found in DB for this Page ID.");
    }
}

fetchTokenFromDB();
