
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://vewqzsqddgmkslnuctvb.supabase.co';
const SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDUzMDQ2MiwiZXhwIjoyMDgwMTA2NDYyfQ.pAgMGN6MtKm1A3fsKr1GIt8-qmKYhwFjSt92L_6_7us";

const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

const COACH_EMAIL = 'coach.himanshusharma@gmail.com';
const MEMBER_EMAIL = 'sharmahimanshu9797@gmail.com';

async function checkHimanshu() {
    console.log("🕵️‍♂️ HIMANSHU TEAM PULSE CHECK (Feb 5)...\n");

    const today = new Date().toISOString().split('T')[0];

    // 1. Check Total Leads for Himanshu Pages
    const { data: leads } = await supabase.from('leads')
        .select('created_at, source')
        .or('source.ilike.%CBO%,source.ilike.%himanshu%')
        .gte('created_at', today + 'T00:00:00')
        .order('created_at', { ascending: false });

    console.log(`📊 TOTAL LEADS TODAY: ${leads.length}`);

    if (leads.length > 0) {
        const lastLead = leads[0];
        const lastTime = new Date(lastLead.created_at).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });
        const timeDiff = Math.floor((new Date() - new Date(lastLead.created_at)) / 60000);
        console.log(`   🕒 Latest Lead: ${lastTime} (${timeDiff} mins ago)`);
    }

    // 2. Check Assignment Logic (Coach vs Member)
    console.log("\n👤 Checking Himanshu's Personal Accounts:");

    // Get IDs
    const { data: users } = await supabase.from('users')
        .select('id, email, leads_today, daily_limit')
        .in('email', [COACH_EMAIL, MEMBER_EMAIL]);

    users.forEach(u => {
        const role = u.email.includes('coach') ? '❌ COACH (Should be 0)' : '✅ MEMBER (Should have leads)';
        console.log(`   - ${role}: Leads=${u.leads_today}, Limit=${u.daily_limit}`);
    });

    // Verify recent leads assigned to Coach (Should be 0)
    const coachUser = users.find(u => u.email.includes('coach'));
    if (coachUser) {
        const { count } = await supabase.from('leads')
            .select('*', { count: 'exact', head: true })
            .eq('assigned_to', coachUser.id)
            .gte('created_at', today + 'T00:00:00');

        if (count > 0) {
            console.log(`\n🚨 ALERT: ${count} leads are still assigned to Coach ID today!`);
        } else {
            console.log(`\n✨ PERFECT: 0 leads assigned to Coach ID.`);
        }
    }
}

checkHimanshu();
