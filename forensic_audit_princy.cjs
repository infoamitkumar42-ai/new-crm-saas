const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = "https://vewqzsqddgmkslnuctvb.supabase.co";
const SUPABASE_SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDUzMDQ2MiwiZXhwIjoyMDgwMTA2NDYyfQ.pAgMGN6MtKm1A3fsKr1GIt8-qmKYhwFjSt92L_6_7us";

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

const USER_ID = 'adcead16-8405-4dc2-8375-f83cef671f7b'; // Princy Rani

async function forensicAudit() {
    console.log("🕵️ FORENSIC AUDIT: PRINCY RANI (princyrani303@gmail.com)");

    // 1. Fetch all leads assigned to her
    const { data: leads, error } = await supabase
        .from('leads')
        .select('created_at, assigned_at, status')
        .eq('assigned_to', USER_ID);

    if (error) {
        console.error("❌ Error fetching leads:", error);
        return;
    }

    console.log(`📊 Total Leads in DB for this User: ${leads.length}`);

    const stats = {
        january: 0,
        feb_pre_payment: 0, // Feb 1 to Feb 4
        feb_post_payment: 0, // Feb 5 to now
    };

    const paymentDate = new Date('2026-02-05T00:00:00.000Z');

    leads.forEach(l => {
        const date = new Date(l.assigned_at || l.created_at);
        const month = date.getUTCMonth(); // 0 is Jan, 1 is Feb

        if (month === 0) {
            stats.january++;
        } else if (month === 1) {
            if (date < paymentDate) {
                stats.feb_pre_payment++;
            } else {
                stats.feb_post_payment++;
            }
        }
    });

    console.log(`\n📅 Breakdown:`);
    console.log(`- January 2026: ${stats.january}`);
    console.log(`- Feb (1st - 4th): ${stats.feb_pre_payment}`);
    console.log(`- Feb (5th - Today): ${stats.feb_post_payment}`);
    console.log(`- TOTAL: ${stats.january + stats.feb_pre_payment + stats.feb_post_payment}`);

    // Check if she had a previous payment
    const { data: payments } = await supabase
        .from('payments')
        .select('*')
        .eq('user_id', USER_ID);

    console.log(`\n💰 Payment Records:`);
    payments.forEach(p => {
        console.log(`- ${p.created_at}: ₹${p.amount} (${p.plan_name}) status: ${p.status}`);
    });
}

forensicAudit();
