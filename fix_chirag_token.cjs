
const { createClient } = require('@supabase/supabase-js');

// 1. Setup Supabase
const SUPABASE_URL = 'https://vewqzsqddgmkslnuctvb.supabase.co';
const SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDUzMDQ2MiwiZXhwIjoyMDgwMTA2NDYyfQ.pAgMGN6MtKm1A3fsKr1GIt8-qmKYhwFjSt92L_6_7us";
const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

// 2. The Token User Provided (Likely a User Token)
const USER_TOKEN = "EAAMp6Xu8vQ8BQqDE75SzTIBovbWFReyfmZCZASKxraTyZCpSJYGZAw5wstnUM34CgJS5tN6KNV0JDzy35HOXdBzjzrpC98ZBW0bBaIu4IVFXRn4kUFApdgZAxTZCGDSZAGZBJf737l4EU1fDjDZAVYHciQOVFKscU2tD88cYK6rtLmCdmzhTfooBkqZCcwZA4UDQRWEsPvUVdp4o4m6OxAouUihEadKZC7rK3esSbgUFbkST5iHZAIG4ZAZAntTZAZAhouEdKuObvRz0HZAQv7qLqZBumlYZD";

// 3. The Target Page ID (Digital Chirag)
const TARGET_PAGE_ID = "928347267036761";

async function fixToken() {
    console.log("🛠️ ATTEMPTING TO EXCHANGE USER TOKEN FOR PAGE TOKEN...");

    try {
        // A. Call Graph API to get Accounts/Pages
        const response = await fetch(`https://graph.facebook.com/v18.0/me/accounts?access_token=${USER_TOKEN}`);
        const data = await response.json();

        if (data.error) {
            console.error("\n❌ ERROR FETCHING ACCOUNTS:", data.error.message);
            return;
        }

        console.log(`✅ Fetched ${data.data ? data.data.length : 0} pages associated with this user.`);

        // B. Find "Digital Chirag"
        const page = data.data.find(p => p.id === TARGET_PAGE_ID);

        if (!page) {
            console.log("\n❌ 'Digital Chirag' page NOT found in this user's account list.");
            return;
        }

        const PAGE_TOKEN = page.access_token;
        console.log(`\n✅ FOUND PAGE TOKEN for 'Digital Chirag'!`);
        console.log(`   ID: ${page.id}`);
        console.log(`   Token Starts With: ${PAGE_TOKEN.substring(0, 15)}...`);

        // C. Update Database (Removed updated_at to be safe)
        console.log("\n💾 Updating Database...");

        const { error } = await supabase.from('meta_pages')
            .update({
                access_token: PAGE_TOKEN
            })
            .eq('page_id', TARGET_PAGE_ID);

        if (error) {
            console.error("❌ DB UPDATE FAILED:", error);
        } else {
            console.log("🎉 SUCCESS! New Page Token saved to database.");
            console.log("   The webhook should start working immediately.");
        }

    } catch (err) {
        console.error("❌ SCRIPT ERROR:", err);
    }
}

fixToken();
