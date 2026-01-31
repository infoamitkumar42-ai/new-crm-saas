const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://vewqzsqddgmkslnuctvb.supabase.co';
const ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ1MzA0NjIsImV4cCI6MjA4MDEwNjQ2Mn0.g-e8YNzEy0Z5ul1RGAhBMDj41TtWGuNPEzZz4XEGPg4";
const supabase = createClient(SUPABASE_URL, ANON_KEY);

async function generateExpiryReport() {
    console.log("📊 Generatng Plan Expiry & Performance Report (Jan 31)...\n");

    const todayStr = '2026-01-31';

    // 1. Fetch Users
    const { data: users, error } = await supabase
        .from('users')
        .select(`
            id, name, email, plan_name, is_active, valid_until,
            total_leads_received, replacement_count, max_replacements,
            leads_today, daily_limit
        `)
        .order('valid_until', { ascending: true }); // Show expiring soon first

    if (error) return console.error(error);

    // 2. Fetch Assignments (First Payments)
    // We need to count assignments where status = 'First Payment Done' (or similar)
    // Actually, 'assignments' table tracks this? Or leads status?
    // Let's check leads table for status='Assignment 1' or 'First Payment'.
    // Or users table might have a summary column? No.
    // Let's count from leads table for accuracy. This is heavy but accurate.

    // Fetching stats for all users is slow. Let's do it for relevant users.
    const expiringUsers = users.filter(u => {
        if (!u.valid_until) return false;
        const validDate = new Date(u.valid_until).toISOString().split('T')[0];
        return validDate <= todayStr;
    });

    console.log(`Checking stats for ${expiringUsers.length} users expiring on or before today...`);

    for (const u of expiringUsers) {
        // Count First Payments
        const { count, error: cError } = await supabase
            .from('leads')
            .select('id', { count: 'exact', head: true })
            .eq('user_id', u.id)
            .ilike('status', '%Payment%'); // Loose match for 'First Payment', 'Full Payment'

        u.payment_count = count || 0;
    }

    // 3. Display Report
    console.log(`\n🛑 USERS TO STOP (Expired/Expiring Today):`);
    console.log(`Format: Name | Plan | Valid Until | Total Leads | Payments | Replacements | Active?`);
    console.log(`-------------------------------------------------------------------------------------`);

    expiringUsers.forEach(u => {
        const date = new Date(u.valid_until).toLocaleDateString();
        const payments = u.payment_count;
        const replace = `${u.replacement_count}/${u.max_replacements || 0}`;
        const active = u.is_active ? "✅ YES" : "❌ NO";

        console.log(`${u.name.padEnd(20)} | ${u.plan_name.padEnd(12)} | ${date} | ${String(u.total_leads_received).padEnd(4)} | ${String(payments).padEnd(3)} | ${replace.padEnd(5)} | ${active}`);
    });

    // 4. Also Show Recently Stopped (Already Inactive but expired recently)
    // Use filters
}

generateExpiryReport();
