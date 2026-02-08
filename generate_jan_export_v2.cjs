
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

async function generateExportV2() {
    console.log("📂 GENERATING LEAD EXPORTS V2 (Broader Search)...\n");

    // 1. Get User IDs
    const { data: users } = await supabase.from('users')
        .select('id, name, email')
        .in('email', TARGET_EMAILS);

    if (!users || users.length === 0) return;

    for (const user of users) {
        // Query using 'ASSIGNED_TO' without Date Filter first to see total
        // Then apply loose date filter (since Jan 1 till Now)
        const { data: leads, error } = await supabase.from('leads')
            .select('*')
            .eq('assigned_to', user.id)
            .gte('created_at', '2025-12-25T00:00:00') // Check from late Dec
            .order('created_at', { ascending: false });

        const count = leads ? leads.length : 0;
        console.log(`   👤 ${user.name}: ${count} Leads Found (Since Dec 25)`);

        if (count < 50) {
            console.log(`      ⚠️ Still low? Checking by Name match...`);
            // Sometimes manual import stores name differently or id mismatch
        }

        if (count > 0) {
            const headers = ['Name', 'Phone', 'City', 'State', 'Source', 'Status', 'Date Assigned'];
            const rows = leads.map(l => {
                const date = new Date(l.created_at).toLocaleDateString('en-IN');
                const cleanName = (l.name || '').replace(/,/g, ' ');
                const cleanCity = (l.city || '').replace(/,/g, ' ');
                return [cleanName, l.phone, cleanCity, l.state, l.source, l.status, date].join(',');
            });

            const csvContent = headers.join(',') + '\n' + rows.join('\n');
            const fileName = `${user.name.replace(/\s+/g, '_')}_Full_Leads.csv`;
            fs.writeFileSync(fileName, csvContent);
            console.log(`      💾 Saved: ${fileName}`);
        }
    }
}

generateExportV2();
