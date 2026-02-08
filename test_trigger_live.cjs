
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://vewqzsqddgmkslnuctvb.supabase.co';
const SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDUzMDQ2MiwiZXhwIjoyMDgwMTA2NDYyfQ.pAgMGN6MtKm1A3fsKr1GIt8-qmKYhwFjSt92L_6_7us";

const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

async function testTrigger() {
    console.log("🧪 TESTING SAFETY NET TRIGGER...");

    const fakePhone = "9999999" + Math.floor(Math.random() * 999);

    // 1. Insert a LEAD with 'New' status (Intentionally Stuck)
    // We expect the DB Trigger to change it to 'Assigned' IMMEDIATELY during insert.
    const { data, error } = await supabase.from('leads').insert({
        name: 'Trigger Test Lead',
        phone: fakePhone,
        source: 'New CBO FAST LEADS - Test', // Should map to TEAMFIRE
        status: 'New'
    }).select().single();

    if (error) {
        console.error("❌ Insert Failed:", error.message);
        return;
    }

    console.log("📥 Inserted as 'New'...");

    // 2. Check Result
    if (data.status === 'Assigned' && data.assigned_to) {
        console.log("✅ SUCCESS! Trigger captured it.");
        console.log(`   - New Status: ${data.status}`);
        console.log(`   - Assigned To ID: ${data.assigned_to}`);

        // Cleanup (Delete Test Lead)
        // await supabase.from('leads').delete().eq('id', data.id);
        // console.log("🧹 Test lead cleaned up.");
    } else {
        console.error("❌ FAILED. Lead is still stuck as:", data.status);
        console.log("   (Trigger might not be active or logic mismatch)");
    }
}

testTrigger();
