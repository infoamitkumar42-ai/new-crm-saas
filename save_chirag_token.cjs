
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://vewqzsqddgmkslnuctvb.supabase.co';
const SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDUzMDQ2MiwiZXhwIjoyMDgwMTA2NDYyfQ.pAgMGN6MtKm1A3fsKr1GIt8-qmKYhwFjSt92L_6_7us";

const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

const TOKEN = "EAAMp6Xu8vQ8BQi2QGfevEUrU15ZCnoFDqNZADkxntqfxTkqeyn2c7rHkv4zLCqRZCzoUoffAIdpNZBdIwBVlxjhSZBtqoEF2C9d897gkqOWeeZC6JBZAXjlzsDGm4KZARZB7iXEE9KnAEdyTwjWDpSeFUgPZB6O5YiVV1nZAy7akcl43432ktarqnIE7XUox6A4zl9ITQDx8EheZCL73PeSSK93Fl6pxD7SZBIMiimPodGN7Ikb2Cr7fNQD7tAKF5Nh5wdB5i5H8Ne8TaJwRIqHgZD";

async function saveToken() {
    console.log("Saving Access Token for Digital Chirag...");

    // First Ensure Column Exists (using upsert logic or direct update)
    // We assume column access_token was added in previous steps.

    const { error } = await supabase
        .from('meta_pages')
        .update({ access_token: TOKEN })
        .eq('page_name', 'Digital Chirag');

    if (error) {
        console.error("❌ Failed to save token:", error);
    } else {
        console.log("✅ Token Saved Successfully!");
        console.log("🔒 System Unlocked. Waiting for Webhook...");
    }
}

saveToken();
