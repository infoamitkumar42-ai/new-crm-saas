
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://vewqzsqddgmkslnuctvb.supabase.co';
const SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDUzMDQ2MiwiZXhwIjoyMDgwMTA2NDYyfQ.pAgMGN6MtKm1A3fsKr1GIt8-qmKYhwFjSt92L_6_7us";

// Try clean options
const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
    auth: { persistSession: false },
    db: { schema: 'public' }
});

async function tryBlastAgain() {
    console.log("📢 Attempting Blast with Clean Client...");

    const { data: users } = await supabase.from('users')
        .select('id, leads_today')
        .gt('leads_today', 0)
        .eq('is_active', true);

    if (!users) return;

    // Try inserting just ONE first
    const testPayload = {
        user_id: users[0].id,
        title: 'Daily Lead Summary 📊',
        message: `You have received ${users[0].leads_today} new leads today. Open CRM to start calling! 📞`,
        type: 'system_alert',
        created_at: new Date().toISOString()
    };

    const { error } = await supabase.from('notifications').insert(testPayload);

    if (error) {
        console.error("❌ Still Failed:", error.message);
    } else {
        console.log("✅ First Insert Success! Proceeding with rest...");

        // Send rest
        const remaining = users.slice(1);
        const chunks = [];
        const chunkSize = 10;
        for (let i = 0; i < remaining.length; i += chunkSize) {
            const chunk = remaining.slice(i, i + chunkSize).map(u => ({
                user_id: u.id,
                title: 'Daily Lead Summary 📊',
                message: `You have received ${u.leads_today} new leads today. Open CRM to start calling! 📞`,
                type: 'system_alert',
                created_at: new Date().toISOString()
            }));
            const { error: e } = await supabase.from('notifications').insert(chunk);
            if (e) console.error("Chunk fail:", e.message);
            else console.log(`Sent batch of ${chunk.length}`);
        }
        console.log("🎉 Done.");
    }
}

tryBlastAgain();
