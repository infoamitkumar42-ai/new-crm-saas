
const { createClient } = require('@supabase/supabase-js');

// 1. Setup Supabase
const SUPABASE_URL = 'https://vewqzsqddgmkslnuctvb.supabase.co';
const SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDUzMDQ2MiwiZXhwIjoyMDgwMTA2NDYyfQ.pAgMGN6MtKm1A3fsKr1GIt8-qmKYhwFjSt92L_6_7us";
const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

async function recoverFromGraph() {
    console.log("🕵️‍♂️ STARTING COMPREHENSIVE GRAPH API RECOVERY (CHIRAG)...");

    // 1. Get Page Config (Token)
    const { data: page } = await supabase.from('meta_pages').select('*').eq('page_name', 'Digital Chirag').single();
    if (!page || !page.access_token) return console.log("❌ Token Missing in DB.");

    console.log("✅ Token found. Fetching forms...");

    // 2. Get Lead Gen Forms
    try {
        const formsRes = await fetch(`https://graph.facebook.com/v18.0/${page.page_id}/leadgen_forms?access_token=${page.access_token}`);
        const formsData = await formsRes.json();

        if (formsData.error) return console.error("❌ Form Fetch Error:", formsData.error.message);

        console.log(`✅ Found ${formsData.data.length} Forms. Scanning for leads from TODAY (Feb 5)...`);

        const todayCheck = new Date('2026-02-05T00:00:00').getTime() / 1000;
        let totalRecovered = 0;
        let totalProcessed = 0;

        const { data: users } = await supabase.from('users')
            .select('id, daily_limit, leads_today')
            .eq('team_code', 'GJ01TEAMFIRE')
            .eq('is_active', true)
            .gt('daily_limit', 0)
            .order('leads_today', { ascending: true });

        let userIdx = 0;

        for (const form of formsData.data) {
            // Fetch leads for each form
            const leadsUrl = `https://graph.facebook.com/v18.0/${form.id}/leads?fields=created_time,id,field_data&limit=50&access_token=${page.access_token}`;
            const leadRes = await fetch(leadsUrl);
            const leadData = await leadRes.json();

            if (!leadData.data) continue;

            for (const lead of leadData.data) {
                const leadTime = new Date(lead.created_time).getTime() / 1000;
                if (leadTime < todayCheck) continue; // Skip old leads

                totalProcessed++;

                // Extract Info
                const nameField = lead.field_data.find(f => f.name.includes('name') || f.name.includes('full_name'));
                const phoneField = lead.field_data.find(f => f.name.includes('phone') || f.name.includes('number'));
                const cityField = lead.field_data.find(f => f.name.includes('city'));

                const name = nameField ? nameField.values[0] : 'Unknown Name';
                let phone = phoneField ? phoneField.values[0] : '';
                const city = cityField ? cityField.values[0] : 'Unknown City';

                if (phone.startsWith('+91')) phone = phone.slice(3);
                phone = phone.replace(/[^0-9]/g, '');

                // Check Duplicate in DB
                const { data: exists } = await supabase.from('leads').select('id').eq('phone', phone).single();

                if (!exists) {
                    process.stdout.write('+'); // Visual Indicator

                    // Assign
                    const target = users[userIdx % users.length];

                    await supabase.from('leads').insert({
                        name: name,
                        phone: phone,
                        city: city,
                        source: `Meta - Digital Chirag (Recovered)`,
                        assigned_to: target.id,
                        status: 'Assigned',
                        created_at: lead.created_time
                    });

                    await supabase.rpc('increment_user_leads', { user_id: target.id });
                    userIdx++;
                    totalRecovered++;
                } else {
                    process.stdout.write('.'); // Dot for existing
                }
            }
        }

        console.log(`\n\n🎉 RECOVERY COMPLETE!`);
        console.log(`   - Leads Scanned: ${totalProcessed}`);
        console.log(`   - New Leads Recovered: ${totalRecovered}`);

    } catch (e) {
        console.error("Script Error:", e);
    }
}

recoverFromGraph();
