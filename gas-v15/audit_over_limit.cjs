
const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://vewqzsqddgmkslnuctvb.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDUzMDQ2MiwiZXhwIjoyMDgwMTA2NDYyfQ.pAgMGN6MtKm1A3fsKr1GIt8-qmKYhwFjSt92L_6_7us';
const supabase = createClient(supabaseUrl, supabaseKey);

async function auditOverLimit() {
    console.log("👮‍♂️ Auditing Over-Limit Assignments (Last 2 Hours)...\n");

    // 1. Get ALL Active Users (Filter in JS)
    const { data: users, error } = await supabase
        .from('users')
        .select('id, name, leads_today, daily_limit')
        .eq('is_active', true);

    if (error) { console.error("User Fetch Error:", error); return; }

    // Filter in JS: assignments >= limit
    const fullUsers = users.filter(u => u.leads_today >= u.daily_limit);
    console.log(`📋 Found ${fullUsers.length} Users who reached/crossed their limit.`);

    if (fullUsers.length === 0) {
        console.log("✅ No users are over limit.");
        return;
    }

    // 2. Check for RECENT assignments to these users
    // Look back 2 hours from now
    const twoHoursAgo = new Date(Date.now() - (2 * 60 * 60 * 1000)).toISOString();

    const fullUserIds = fullUsers.map(u => u.id);

    // Fetch leads assigned to these FULL users recently
    const { data: leads, error: lErr } = await supabase
        .from('leads')
        .select('id, name, assigned_to, assigned_at')
        .in('assigned_to', fullUserIds)
        .gte('assigned_at', twoHoursAgo)
        .order('assigned_at', { ascending: false });

    if (lErr) { console.error("Lead Fetch Error:", lErr); return; }

    if (leads.length === 0) {
        console.log("✅ CLEAN: No leads assigned to full users in the last 2 hours.");
        console.log("   The over-limit counts are likely from older bulk assignments.");
    } else {
        console.log(`❌ LEAKAGE DETECTED: ${leads.length} leads assigned to full users recently!`);
        leads.forEach(l => {
            const u = fullUsers.find(user => user.id === l.assigned_to);
            console.log(`   🔸 User: ${u.name} (Limit: ${u.daily_limit}, Has: ${u.leads_today})`);
            console.log(`      Lead: ${l.name} @ ${new Date(l.assigned_at).toLocaleString()}`);
        });
    }
}

auditOverLimit();
