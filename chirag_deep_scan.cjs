
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://vewqzsqddgmkslnuctvb.supabase.co';
const SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDUzMDQ2MiwiZXhwIjoyMDgwMTA2NDYyfQ.pAgMGN6MtKm1A3fsKr1GIt8-qmKYhwFjSt92L_6_7us";

const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

async function deepAuditChirag() {
    console.log("🕵️‍♂️ DEEP SCAN: Scanning ALL Members in Chirag Team...\n");

    const { data: users, error } = await supabase.from('users')
        .select('name, email, daily_limit, leads_today, is_active, plan_name')
        .eq('team_code', 'GJ01TEAMFIRE');

    if (error) return console.error(error);

    const report = users.map(u => ({
        Name: u.name,
        Email: u.email,
        'Daily Limit': u.daily_limit,
        'Leads Today': u.leads_today,
        'Is Active': u.is_active,
        'Plan': u.plan_name || 'None'
    }));

    // Sort to show people with 0 leads and Active status first
    report.sort((a, b) => a['Leads Today'] - b['Leads Today']);

    console.table(report);
}

deepAuditChirag();
