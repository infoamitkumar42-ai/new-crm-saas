
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://vewqzsqddgmkslnuctvb.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDUzMDQ2MiwiZXhwIjoyMDgwMTA2NDYyfQ.pAgMGN6MtKm1A3fsKr1GIt8-qmKYhwFjSt92L_6_7us';
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkPostFixLeakage() {
    console.log("👮‍♂️ Checking for Leakage AFTER Fix (Post 5:30 PM IST)...\n");

    // 1. Get Over-Limit Users
    // Get all users first, then filter in JS to avoid Supabase version issues
    const { data: users, error: uErr } = await supabase
        .from('users')
        .select('id, name, leads_today, daily_limit')
        .eq('is_active', true);

    if (uErr) { console.error("User Error:", uErr); return; }

    const fullUsers = users.filter(u => (u.leads_today || 0) >= (u.daily_limit || 0));
    console.log(`📋 Full Users Found: ${fullUsers.length}`);

    if (fullUsers.length === 0) {
        console.log("✅ No users are currently over limit.");
        return;
    }

    const fullUserIds = fullUsers.map(u => u.id);

    // 2. Check for assignments AFTER 5:30 PM IST (12:00 UTC)
    // Adjusting for safety, let's say 12:00 UTC (5:30 PM IST)
    const checkTime = '2026-01-18T12:00:00.000Z';

    const { data: leads, error: lErr } = await supabase
        .from('leads')
        .select('id, name, assigned_to, assigned_at')
        .in('assigned_to', fullUserIds)
        .gte('assigned_at', checkTime)
        .order('assigned_at', { ascending: false });

    if (lErr) { console.error("Lead Error:", lErr); return; }

    if (leads.length === 0) {
        console.log("✅ SUCCESS: Zero leads assigned to full users after 5:30 PM.");
        console.log("   The system has successfully STOPPED assignments.");
    } else {
        console.log(`❌ LEAKAGE FOUND: ${leads.length} assignments post-fix!`);
        leads.forEach(l => {
            const u = fullUsers.find(user => user.id === l.assigned_to);
            // Convert to IST
            const date = new Date(l.assigned_at);
            const istDate = new Date(date.getTime() + (5.5 * 60 * 60 * 1000));
            console.log(`   🔸 ${l.name} -> ${u.name} (${u.leads_today}/${u.daily_limit}) @ ${istDate.toISOString().replace('T', ' ').substring(11, 19)} IST`);
        });
    }
}

checkPostFixLeakage();
