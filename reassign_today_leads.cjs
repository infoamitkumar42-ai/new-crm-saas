const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = "https://vewqzsqddgmkslnuctvb.supabase.co";
const SUPABASE_SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDUzMDQ2MiwiZXhwIjoyMDgwMTA2NDYyfQ.pAgMGN6MtKm1A3fsKr1GIt8-qmKYhwFjSt92L_6_7us";

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

const SOURCE_EMAIL = 'ms028777@gmail.com';
const TARGET_EMAIL = 'sainsachin737@gmail.com';

async function reassignLeads() {
    console.log(`🔄 REASSIGNING TODAY'S LEADS: ${SOURCE_EMAIL} -> ${TARGET_EMAIL}`);

    // 1. Get User IDs
    const { data: users, error: userError } = await supabase
        .from('users')
        .select('id, email, name, total_leads_received')
        .in('email', [SOURCE_EMAIL, TARGET_EMAIL]);

    if (userError || !users || users.length < 2) {
        console.error("❌ Error fetching users or user missing:", userError || "User missing");
        return;
    }

    const sourceUser = users.find(u => u.email === SOURCE_EMAIL);
    const targetUser = users.find(u => u.email === TARGET_EMAIL);

    console.log(`👤 Source: ${sourceUser.name} (${sourceUser.id})`);
    console.log(`👤 Target: ${targetUser.name} (${targetUser.id})`);

    // 2. Find Today's Leads for Source
    const today = new Date().toISOString().split('T')[0];
    const { data: leads, error: leadError } = await supabase
        .from('leads')
        .select('id, name')
        .eq('assigned_to', sourceUser.id)
        .gte('assigned_at', today);

    if (leadError) {
        console.error("❌ Error fetching leads:", leadError);
        return;
    }

    if (!leads || leads.length === 0) {
        console.log("ℹ️ No leads found for source user today.");
        return;
    }

    console.log(`📈 Found ${leads.length} leads to reassign.`);

    // 3. Reassign
    const leadIds = leads.map(l => l.id);
    const { error: updateError } = await supabase
        .from('leads')
        .update({
            assigned_to: targetUser.id,
            user_id: targetUser.id,
            status: 'Fresh',
            assigned_at: new Date().toISOString()
        })
        .in('id', leadIds);

    if (updateError) {
        console.error("❌ Error updating leads:", updateError);
        return;
    }

    // 4. Update Counters (Optional but good for consistency)
    // decrement source, increment target
    await supabase.from('users').update({
        total_leads_received: Math.max(0, sourceUser.total_leads_received - leads.length)
    }).eq('id', sourceUser.id);

    await supabase.from('users').update({
        total_leads_received: targetUser.total_leads_received + leads.length
    }).eq('id', targetUser.id);

    console.log("✅ Reassignment Complete!");
}

reassignLeads();
