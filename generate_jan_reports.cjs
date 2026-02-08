
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const SUPABASE_URL = 'https://vewqzsqddgmkslnuctvb.supabase.co';
const SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDUzMDQ2MiwiZXhwIjoyMDgwMTA2NDYyfQ.pAgMGN6MtKm1A3fsKr1GIt8-qmKYhwFjSt92L_6_7us";

const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

const TARGET_EMAILS = [
    'workwithrajwinder@gmail.com',
    'sunnymehre451@gmail.com',
    'gurnambal01@gmail.com',
    'rajnikaler01@gmail.com'
];

async function generateReports() {
    console.log("📊 Generating January Reports...");

    // 1. Get User IDs
    const { data: users, error } = await supabase
        .from('users')
        .select('id, name, email')
        .in('email', TARGET_EMAILS);

    if (!users || users.length === 0) {
        console.error("❌ No users found!");
        return;
    }

    console.log(`✅ Found ${users.length} users.`);

    // Date Range: Jan 1 2026 to Jan 31 2026
    const startDate = '2026-01-01T00:00:00.000Z';
    const endDate = '2026-01-31T23:59:59.999Z';

    for (const user of users) {
        console.log(`\n📂 Processing: ${user.name} (${user.email})...`);

        // 2. Fetch Leads
        const { data: leads } = await supabase
            .from('leads')
            .select('created_at, name, phone, city, status, source')
            .eq('assigned_to', user.id)
            .gte('created_at', startDate)
            .lte('created_at', endDate)
            .order('created_at', { ascending: true });

        if (!leads || leads.length === 0) {
            console.log(`   ⚠️ No leads found for January.`);
            continue;
        }

        console.log(`   ✅ Found ${leads.length} leads.`);

        // 3. Create CSV Content
        // Header
        let csvContent = "Date,Name,Phone,City,Status,Source\n";

        // Rows
        leads.forEach(l => {
            const date = new Date(l.created_at).toLocaleDateString();
            // Handle commas in content
            const name = l.name ? `"${l.name.replace(/"/g, '""')}"` : "";
            const phone = l.phone || "";
            const city = l.city || "";
            const status = l.status || "";
            const source = l.source || "";

            csvContent += `${date},${name},${phone},${city},${status},${source}\n`;
        });

        // 4. Write to File
        const cleanName = user.name.replace(/[^a-zA-Z0-9]/g, '_');
        const fileName = `Report_Jan2026_${cleanName}.csv`;

        fs.writeFileSync(fileName, csvContent);
        console.log(`   💾 Saved: ${fileName}`);
    }

    console.log("\n🎉 All Reports Generated Successfully!");
}

generateReports();
