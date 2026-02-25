const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = "https://vewqzsqddgmkslnuctvb.supabase.co";
const SUPABASE_SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDUzMDQ2MiwiZXhwIjoyMDgwMTA2NDYyfQ.pAgMGN6MtKm1A3fsKr1GIt8-qmKYhwFjSt92L_6_7us";

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

const TARGET_USERS = [
    { email: 'vaishaliadesra78@gmail.com', plan: 'starter' },
    { email: 'nodhichetanchoksi@gmail.com', plan: 'starter' },
    { email: 'sameerchauhan010424@gmail.com', plan: 'starter' },
    { email: 'saurabhdholakiya6364@gmail.com', plan: 'weekly_boost' },
    { email: 'sonalben0099@gmail.com', plan: 'weekly_boost' },
    { email: 'utsavsadhu024@gmail.com', plan: 'weekly_boost' },
    { email: 'jyotikeshwani08@gmail.com', plan: 'supervisor' }
];

const PLAN_LIMITS = {
    'starter': 5,
    'supervisor': 7,
    'manager': 8,
    'weekly_boost': 12,
    'turbo_boost': 14
};

async function reactivateUsers() {
    console.log("🚀 STARTING MANUAL REACTIVATION FOR 7 USERS...");

    const thirtyDaysLater = new Date();
    thirtyDaysLater.setDate(thirtyDaysLater.getDate() + 30);
    const validUntil = thirtyDaysLater.toISOString();

    for (const target of TARGET_USERS) {
        const dailyLimit = PLAN_LIMITS[target.plan];

        console.log(`\nProcessing ${target.email}...`);
        console.log(`-> Setting Plan: ${target.plan} (Limit: ${dailyLimit})`);
        console.log(`-> Valid Until: ${validUntil}`);

        const { data, error } = await supabase
            .from('users')
            .update({
                payment_status: 'active',
                is_active: true,
                valid_until: validUntil,
                plan_name: target.plan,
                daily_limit: dailyLimit,
                daily_limit_override: dailyLimit, // Ensure override is synced
                plan_start_date: new Date().toISOString()
            })
            .eq('email', target.email)
            .select();

        if (error) {
            console.error(`❌ FAILED for ${target.email}:`, error.message);
        } else if (data && data.length > 0) {
            console.log(`✅ SUCCESS: ${data[0].name} activated.`);
        } else {
            console.log(`⚠️ User not found or no change: ${target.email}`);
        }
    }
    console.log("\n🏁 Reactivation Complete.");
}

reactivateUsers();
