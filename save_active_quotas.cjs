const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const SUPABASE_URL = "https://vewqzsqddgmkslnuctvb.supabase.co";
const SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDUzMDQ2MiwiZXhwIjoyMDgwMTA2NDYyfQ.pAgMGN6MtKm1A3fsKr1GIt8-qmKYhwFjSt92L_6_7us";
const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

const PLAN_LIMITS = {
    'starter': 50,
    'weekly_boost': 100,
    'manager': 200,
    'supervisor': 150,
    'turbo_boost': 250
};

async function main() {
    const { data: users } = await supabase.from('users').select('id, name, email, plan_name').eq('is_active', true);
    const { data: payments } = await supabase.from('payments').select('user_id, created_at').eq('status', 'captured').order('created_at', { ascending: false });

    const userLatestPaymentDate = {};
    if (payments) {
        for (let p of payments) {
            if (!userLatestPaymentDate[p.user_id]) {
                userLatestPaymentDate[p.user_id] = new Date(p.created_at);
            }
        }
    }

    const overLimitUsers = [];

    for (let u of users) {
        const startDate = userLatestPaymentDate[u.id] || new Date(0);

        const { data: leads } = await supabase
            .from('leads')
            .select('id')
            .eq('assigned_to', u.id)
            .gte('created_at', startDate.toISOString());

        let leadsSincePayment = leads ? leads.length : 0;
        const limit = PLAN_LIMITS[u.plan_name] || 9999;

        if (leadsSincePayment >= limit && limit !== 9999) {
            overLimitUsers.push({
                name: u.name,
                email: u.email,
                plan: u.plan_name,
                leadsReceived: leadsSincePayment,
                limit: limit,
                lastPaymentStr: userLatestPaymentDate[u.id] ? userLatestPaymentDate[u.id].toISOString().split('T')[0] : 'Unknown'
            });
        }
    }

    overLimitUsers.sort((a, b) => b.leadsReceived - a.leadsReceived);

    let report = `Found ${overLimitUsers.length} ACTIVE users at or exceeding their standard limits:\n\n`;
    overLimitUsers.forEach(u => {
        report += `- ${u.name} (${u.email})\n`;
        report += `  Plan: ${u.plan} | Limit: ${u.limit} | Received Since ${u.lastPaymentStr}: ${u.leadsReceived}\n\n`;
    });

    fs.writeFileSync('over_limit_report.txt', report);
    console.log("Saved to over_limit_report.txt");
}

main().catch(console.error);
