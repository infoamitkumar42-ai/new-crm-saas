const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = "https://vewqzsqddgmkslnuctvb.supabase.co";
const SUPABASE_SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDUzMDQ2MiwiZXhwIjoyMDgwMTA2NDYyfQ.pAgMGN6MtKm1A3fsKr1GIt8-qmKYhwFjSt92L_6_7us";

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

const usersToAudit = [
    "bs0525765349@gmail.com",
    "rathoddevanshi774@gmail.com"
];

async function auditBatch() {
    console.log(`🔍 BATCH AUDIT FOR SPECIFIC USERS`);

    for (const email of usersToAudit) {
        console.log(`\n-----------------------------------`);
        console.log(`📧 AUDITING: ${email}`);

        // 1. Fetch User Profile
        const { data: user, error: userError } = await supabase
            .from('users')
            .select('*')
            .ilike('email', email)
            .maybeSingle();

        if (!user) {
            console.log(`❌ User not found.`);
            continue;
        }

        console.log(`👤 Name: ${user.name} | Role: ${user.role} | Team: ${user.team_code}`);
        console.log(`📊 Stats: Promised: ${user.total_leads_promised}, Received: ${user.total_leads_received}, Active: ${user.is_active}`);
        console.log(`🕒 Plan Start: ${user.plan_start_date}`);

        // 2. Fetch Payments
        const { data: payments } = await supabase
            .from('payments')
            .select('*')
            .eq('user_id', user.id)
            .eq('status', 'captured')
            .order('created_at', { ascending: false });

        console.log(`💳 Payments (${payments?.length || 0} captured):`);
        payments?.forEach(p => {
            console.log(`   - ${new Date(p.created_at).toLocaleDateString()} | ${p.amount / 100} INR | ${p.plan_name}`);
        });

        // 3. Physical Lead Count
        const { count: physicalCount } = await supabase
            .from('leads')
            .select('*', { count: 'exact', head: true })
            .or(`user_id.eq.${user.id},assigned_to.eq.${user.id}`);

        console.log(`📈 Physical Leads in DB: ${physicalCount}`);

        // 4. Check for exhausted quota
        if (user.total_leads_received >= user.total_leads_promised || physicalCount >= user.total_leads_promised) {
            console.log(`⚠️ QUOTA EXHAUSTED: ${physicalCount}/${user.total_leads_promised}`);
        } else {
            console.log(`✅ Quota remaining: ${user.total_leads_promised - Math.max(user.total_leads_received, physicalCount)} leads.`);
        }
    }
}

auditBatch();
