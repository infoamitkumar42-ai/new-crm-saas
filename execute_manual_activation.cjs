const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = "https://vewqzsqddgmkslnuctvb.supabase.co";
const SUPABASE_SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDUzMDQ2MiwiZXhwIjoyMDgwMTA2NDYyfQ.pAgMGN6MtKm1A3fsKr1GIt8-qmKYhwFjSt92L_6_7us";

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

const USERS = [
    { email: 'arshkaur6395@gmail.com', id: 'a921d3c0-ca74-4e37-ade3-cf6439ac4fc5', paymentDate: '2026-10-01' },
    { email: 'hansmanraj88@gmail.com', id: '6b39f292-aa76-4ed4-8f91-e0c4d49c522f', paymentDate: '2026-10-02' }
];

const STARTER_QUOTA = 50;

async function activateUsers() {
    console.log("🚀 STARTING MANUAL ACTIVATION...");

    for (const u of USERS) {
        console.log(`\nProcessing ${u.email}...`);

        // 1. Count leads since payment
        const { count, error: countError } = await supabase
            .from('leads')
            .select('*', { count: 'exact', head: true })
            .eq('assigned_to', u.id)
            .gte('assigned_at', u.paymentDate);

        if (countError) {
            console.error(`❌ Error counting leads for ${u.email}:`, countError);
            continue;
        }

        const receivedSincePayment = count || 0;
        const pending = Math.max(0, STARTER_QUOTA - receivedSincePayment);

        console.log(`📊 Received since ${u.paymentDate}: ${receivedSincePayment}`);
        console.log(`🔢 Pending Quota: ${pending}`);

        // 2. Update User
        // If pending > 0, set daily limit and ensure active.
        // If pending == 0, wait, maybe user wants to give fresh 50? 
        // User said "jis din se payment kri hai... utni limit set krke active krdo".

        const updates = {
            is_active: true,
            team_code: 'TEAMFIRE', // Ensure both are in Himanshu's team
            daily_limit: pending > 0 ? 5 : 0, // Set a safe daily limit
            plan_name: 'starter'
        };

        if (pending > 0) {
            console.log(`📝 Activating with Daily Limit 5 to recover ${pending} leads.`);
        } else {
            console.log(`📝 Already received quota. Activating with 0 limit (unless user asks for more).`);
        }

        const { error: updateError } = await supabase
            .from('users')
            .update(updates)
            .eq('id', u.id);

        if (updateError) {
            console.error(`❌ Error updating ${u.email}:`, updateError);
        } else {
            console.log(`✅ ${u.email} successfully activated!`);
        }
    }
}

activateUsers();
