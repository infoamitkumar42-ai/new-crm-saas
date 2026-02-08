
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

async function exportAllDashboardData() {
    console.log("📂 EXPORTING ALL DASHBOARD LEADS (No Date Limit)...\n");

    // 1. Get User IDs
    const { data: users } = await supabase.from('users')
        .select('id, name, email')
        .in('email', TARGET_EMAILS);

    if (!users || users.length === 0) return console.error("❌ Users not found.");

    for (const user of users) {
        // 2. Fetch ALL leads assigned to this user (NO DATE FILTER)
        const { data: leads, error } = await supabase.from('leads')
            .select('*')
            .eq('assigned_to', user.id)
            .order('created_at', { ascending: false });

        if (error) {
            console.error(`❌ Error fetching for ${user.email}:`, error.message);
            continue;
        }

        const count = leads ? leads.length : 0;
        console.log(`   👤 ${user.name} (${user.email})`);
        console.log(`      📊 Dashboard Total: ${count} Leads`);

        if (count > 0) {
            // 3. Generate CSV
            const headers = ['Name', 'Phone', 'City', 'State', 'Source', 'Status', 'Date', 'Notes'];
            const rows = leads.map(l => {
                const date = new Date(l.created_at).toLocaleDateString('en-IN');
                const cleanName = (l.name || 'Unknown').replace(/,/g, ' ');
                const cleanPhone = (l.phone || '').replace(/,/g, ' ');
                const cleanCity = (l.city || '').replace(/,/g, ' ');
                const cleanState = (l.state || '').replace(/,/g, ' ');
                const cleanSource = (l.source || '').replace(/,/g, ' ');
                const cleanNotes = (l.notes || '').replace(/,/g, ' ').replace(/\n/g, ' '); // remove newlines

                return [cleanName, cleanPhone, cleanCity, cleanState, cleanSource, l.status, date, cleanNotes].join(',');
            });

            const csvContent = headers.join(',') + '\n' + rows.join('\n');
            const fileName = `FINAL_${user.name.replace(/\s+/g, '_')}_All_Leads.csv`;

            fs.writeFileSync(fileName, csvContent);
            console.log(`      💾 CSV Generated: ${fileName}`);
        }
        console.log('-------------------------------------------');
    }
    console.log("\n✅ All requested exports are ready.");
}

exportAllDashboardData();
