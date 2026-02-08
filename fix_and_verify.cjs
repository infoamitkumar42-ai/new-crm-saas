
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://vewqzsqddgmkslnuctvb.supabase.co';
const SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDUzMDQ2MiwiZXhwIjoyMDgwMTA2NDYyfQ.pAgMGN6MtKm1A3fsKr1GIt8-qmKYhwFjSt92L_6_7us";

const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

const TOKEN = "EAAMp6Xu8vQ8BQi2QGfevEUrU15ZCnoFDqNZADkxntqfxTkqeyn2c7rHkv4zLCqRZCzoUoffAIdpNZBdIwBVlxjhSZBtqoEF2C9d897gkqOWeeZC6JBZAXjlzsDGm4KZARZB7iXEE9KnAEdyTwjWDpSeFUgPZB6O5YiVV1nZAy7akcl43432ktarqnIE7XUox6A4zl9ITQDx8EheZCL73PeSSK93Fl6pxD7SZBIMiimPodGN7Ikb2Cr7fNQD7tAKF5Nh5wdB5i5H8Ne8TaJwRIqHgZD";

async function fixAndVerify() {
    console.log("🛠️ Fixing Duplicate Pages & Setting Token...");

    // 1. DELETE WRONG PAGE (615...)
    const { error: delErr } = await supabase
        .from('meta_pages')
        .delete()
        .eq('page_id', '61578124993244'); // The old one

    if (delErr) console.error("Del Error:", delErr);
    else console.log("🗑️ Deleted Old Duplicate Page.");

    // 2. SET TOKEN ON CORRECT PAGE (928...)
    const { error: upErr } = await supabase
        .from('meta_pages')
        .update({ access_token: TOKEN })
        .eq('page_id', '928347267036761');

    if (upErr) {
        console.error("❌ Token Update Failed:", upErr);
        return;
    }
    console.log("✅ Token Updated on Page ID 928347267036761");

    // 3. FINAL VERIFICATION PING
    console.log("🌐 Verifying with Facebook...");
    try {
        const url = `https://graph.facebook.com/me?access_token=${TOKEN}`;
        const res = await fetch(url);
        const json = await res.json();

        if (json.id === '928347267036761') {
            console.log("🟢 SUCCESS: Token matches Page ID 928347267036761");
            console.log("🚀 CHIRAG CONNECTION: 100% ONLINE");
        } else {
            console.log("⚠️ Token ID Mismatch. Got:", json.id, json);
        }
    } catch (e) {
        console.error("Ping Error:", e);
    }
}

fixAndVerify();
