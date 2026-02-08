
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const SUPABASE_URL = 'https://vewqzsqddgmkslnuctvb.supabase.co';
const SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDUzMDQ2MiwiZXhwIjoyMDgwMTA2NDYyfQ.pAgMGN6MtKm1A3fsKr1GIt8-qmKYhwFjSt92L_6_7us";

const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

const TARGET_EMAILS = [
    'gurnambal01@gmail.com',
    'workwithrajwinder@gmail.com',
    'rajnikaler01@gmail.com',
    'sunnymehre451@gmail.com'
];

async function generateExports() {
    console.log("📂 GENERATING LEAD EXPORTS (JANUARY 2026)...\n");

    const startDate = '2026-01-01T00:00:00';
    const endDate = '2026-01-31T23:59:59';

    // 1. Get User IDs
    const { data: users, error } = await supabase.from('users')
        .select('id, name, email')
        .in('email', TARGET_EMAILS);

    if (error || !users || users.length === 0) {
        return console.error("❌ No users found for given emails.");
    }

    console.log(`✅ Found ${users.length} users. Fetching leads...`);

    for (const user of users) {
        // 2. Fetch Leads for each user
        const { data: leads, error: leadsErr } = await supabase.from('leads')
            .select('name, phone, city, state, source, status, created_at')
            .eq('assigned_to', user.id)
            .gte('created_at', startDate)
            .lte('created_at', endDate)
            .order('created_at', { ascending: false });

        if (leadsErr) {
            console.error(`❌ Error fetching for ${user.name}:`, leadsErr.message);
            continue;
        }

        const count = leads ? leads.length : 0;
        console.log(`   👤 ${user.name} (${user.email}): ${count} Leads`);

        if (count === 0) continue;

        // 3. Create CSV Content
        const headers = ['Name', 'Phone', 'City', 'State', 'Source', 'Status', 'Date Assigned'];
        const rows = leads.map(l => {
            const date = new Date(l.created_at).toLocaleDateString('en-IN');
            // Sanitize
            const cleanName = (l.name || '').replace(/,/g, ' ');
            const cleanCity = (l.city || '').replace(/,/g, ' ');
            return [cleanName, l.phone, cleanCity, l.state, l.source, l.status, date].join(',');
        });

        const csvContent = headers.join(',') + '\n' + rows.join('\n');

        // 4. Save to File
        const fileName = `${user.name.replace(/\s+/g, '_')}_Jan_Leads.csv`;
        fs.writeFileSync(fileName, csvContent);
        console.log(`      💾 Saved: ${fileName}`);
    }

    console.log("\n✅ ALL EXPORTS GENERATED SUCCESSFULLY.");
}

generateExports();
