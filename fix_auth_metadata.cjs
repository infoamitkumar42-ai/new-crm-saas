
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://vewqzsqddgmkslnuctvb.supabase.co';
const SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDUzMDQ2MiwiZXhwIjoyMDgwMTA2NDYyfQ.pAgMGN6MtKm1A3fsKr1GIt8-qmKYhwFjSt92L_6_7us";

const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

async function fixAuthMetadata() {
    console.log("🛠️ FIXING AUTH METADATA for info.amitkumar42@gmail.com...");

    // 1. Get User ID (We know it from previous step: 1ddde0e2-a9f3-421a-8a0f-15386e1db441)
    const userId = '1ddde0e2-a9f3-421a-8a0f-15386e1db441';

    // 2. Update Auth Metadata
    const { data, error } = await supabase.auth.admin.updateUserById(
        userId,
        { user_metadata: { role: 'admin', name: 'Amit (Admin)' } }
    );

    if (error) {
        console.error("❌ Auth Update Failed:", error);
    } else {
        console.log("✅ Auth Metadata Updated Successfully!");
        console.log("   User Metadata:", data.user.user_metadata);
        console.log("   Now try logging out and logging back in.");
    }
}

fixAuthMetadata();
