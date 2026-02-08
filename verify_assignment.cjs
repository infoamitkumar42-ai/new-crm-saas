
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://vewqzsqddgmkslnuctvb.supabase.co';
const SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDUzMDQ2MiwiZXhwIjoyMDgwMTA2NDYyfQ.pAgMGN6MtKm1A3fsKr1GIt8-qmKYhwFjSt92L_6_7us";

const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

const BATCH_1_SAMPLES = ['9624249683', '7041846785', '9574490397', '8758161439']; // First few

async function check() {
    console.log("🕵️ VERIFYING LEAD ASSIGNMENT FOR BATCH 1...");

    const { data: leads, error } = await supabase
        .from('leads')
        .select('name, phone, assigned_to, status, created_at, assigned_at')
        .in('phone', BATCH_1_SAMPLES);

    if (error) {
        console.error("❌ Error fetching leads:", error);
        return;
    }

    if (!leads || leads.length === 0) {
        console.error("❌ NO LEADS PROCESSED! Something went wrong.");
        return;
    }

    console.log(`✅ FOUND ${leads.length} / ${BATCH_1_SAMPLES.length} SAMPLE LEADS.`);

    for (const lead of leads) {
        console.log(`\n📞 Lead: ${lead.name} (${lead.phone})`);
        console.log(`   Status: ${lead.status}`);
        console.log(`   Assigned To: ${lead.assigned_to ? lead.assigned_to : '❌ UNASSIGNED'}`);
        console.log(`   Assigned At: ${lead.assigned_at}`);

        if (lead.assigned_to) {
            // Check Notification
            const { data: notif } = await supabase
                .from('notifications')
                .select('*')
                .eq('user_id', lead.assigned_to)
                .like('message', `%${lead.name}%`)
                .order('created_at', { ascending: false })
                .limit(1);

            if (notif && notif.length > 0) {
                console.log("   ✅ Notification Sent: YES");
            } else {
                console.log("   ⚠️ Notification Sent: NO (Warning)");
            }

            // Get User Name
            const { data: user } = await supabase.from('users').select('name').eq('id', lead.assigned_to).single();
            console.log(`   Owner: ${user?.name}`);
        }
    }
}

check();
