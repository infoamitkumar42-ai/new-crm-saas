
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://vewqzsqddgmkslnuctvb.supabase.co';
const SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDUzMDQ2MiwiZXhwIjoyMDgwMTA2NDYyfQ.pAgMGN6MtKm1A3fsKr1GIt8-qmKYhwFjSt92L_6_7us";

const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

async function deepAudit() {
    console.log("🕵️‍♂️ Deep Audit: Assigned 'Facebook' source leads...");

    const startOfDay = new Date(); startOfDay.setHours(0, 0, 0, 0);
    const now = new Date();

    // 1. Get 'facebook' source leads that are Assigned today
    const { data: leads } = await supabase.from('leads')
        .select('id, assigned_to, name, source')
        .or('source.eq.facebook,source.eq.Facebook Orphan Rescue')
        .eq('status', 'Assigned')
        .gte('created_at', startOfDay.toISOString());

    if (!leads || leads.length === 0) {
        console.log("No distributed facebook leads found.");
        return;
    }

    console.log(`Checking ${leads.length} assigned leads...`);

    // 2. Map Users
    const userIds = [...new Set(leads.map(l => l.assigned_to).filter(Boolean))];
    const { data: users } = await supabase.from('users')
        .select('id, name, valid_until, plan_name, is_active')
        .in('id', userIds);

    const badUsers = [];
    const leadsToReclaim = [];

    users.forEach(u => {
        const expiry = new Date(u.valid_until);
        // Is user Active AND Plan is Active?
        if (!u.is_active || !u.valid_until || expiry < now) {
            badUsers.push({ Name: u.name, Plan: u.plan_name || 'None', Expired: expiry < now ? 'YES' : 'No Date' });

            // Find leads assigned to this bad user
            const badLeads = leads.filter(l => l.assigned_to === u.id).map(l => l.id);
            leadsToReclaim.push(...badLeads);
        }
    });

    if (badUsers.length > 0) {
        console.error(`\n🚨 FOUND ${badUsers.length} UNPAID/EXPIRED USERS WITH LEADS:`);
        console.table(badUsers);
        console.log(`\nReclaiming ${leadsToReclaim.length} leads...`);

        // RECLAIM LOGIC
        // We set them back to 'Orphan' source/status so we can re-run the correct assigner
        // Or re-assign them properly here.
    } else {
        console.log("✅ ALL ASSIGNMENTS VALID (All Users are Paid & Active).");
    }
}

deepAudit();
