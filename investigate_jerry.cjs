const { createClient } = require('@supabase/supabase-js');

// HARDCODED CREDENTIALS
const SUPABASE_URL = 'https://vewqzsqddgmkslnuctvb.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDUzMDQ2MiwiZXhwIjoyMDgwMTA2NDYyfQ.pAgMGN6MtKm1A3fsKr1GIt8-qmKYhwFjSt92L_6_7us';
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function investigateJerry() {
    console.log('--- INVESTIGATING JERRY ---');
    const email = 'jerryvibes.444@gmail.com';

    // 1. Get User
    const { data: user } = await supabase.from('users').select('*').eq('email', email).single();

    if (!user) {
        console.log('User not found');
        return;
    }

    console.log('User Details:');
    console.log(`ID: ${user.id}`);
    console.log(`Name: ${user.name}`);
    console.log(`Plan: ${user.plan_name}`);
    console.log(`Daily Limit: ${user.daily_limit}`);
    console.log(`Leads Today (Stored): ${user.leads_today}`);
    console.log(`Is Active: ${user.is_active}`);

    // 2. Count ACTUAL Leads Today
    const today = new Date().toISOString().split('T')[0];
    const { count, data: leads } = await supabase.from('leads')
        .select('source, created_at', { count: 'exact' })
        .eq('user_id', user.id)
        .gte('created_at', today);

    console.log(`\nActual Leads Today: ${count}`);
    if (leads.length > 0) {
        console.log('Sample Sources:', [...new Set(leads.map(l => l.source))]);
    }
}

investigateJerry();
