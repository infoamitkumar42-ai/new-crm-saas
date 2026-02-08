
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://vewqzsqddgmkslnuctvb.supabase.co';
const SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDUzMDQ2MiwiZXhwIjoyMDgwMTA2NDYyfQ.pAgMGN6MtKm1A3fsKr1GIt8-qmKYhwFjSt92L_6_7us";

const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

// Details
const PAGE_ID = '928347267036761'; // Digital Chirag
const PAGE_ACCESS_TOKEN = "EAAGm0PX4ZCpsBO4lZB8B7z6rZCrjUZBwZAqRdtRZC1JbW12L3y16ZC1r2WwlXwPZBP3t8kU8H2P6zAZDZD"; // Used previously
const TEAM_CODE = 'GJ01TEAMFIRE';

async function recoverLeads() {
    console.log("🚑 STARTING LEAD RECOVERY FROM FACEBOOK GRAPH API...\n");

    // 1. Fetch Forms for Page
    const formsUrl = `https://graph.facebook.com/v19.0/${PAGE_ID}/leadgen_forms?access_token=${PAGE_ACCESS_TOKEN}`;
    const formsRes = await fetch(formsUrl);
    const formsData = await formsRes.json();

    if (!formsData.data) {
        return console.error("❌ Failed to fetch forms:", formsData);
    }

    console.log(`📋 Found ${formsData.data.length} Lead Forms. Scanning leads from today...`);

    // 2. Get Active Clean Users from Team
    const { data: users } = await supabase.from('users')
        .select('id, leads_today, daily_limit')
        .eq('team_code', TEAM_CODE)
        .eq('is_active', true)
        .gt('daily_limit', 0)
        .order('leads_today', { ascending: true }); // Give to those with least leads

    if (!users || users.length === 0) return console.error("❌ No active users to assign leads to.");

    let userIdx = 0;
    let recoveredCount = 0;
    const since = Math.floor(new Date().setHours(0, 0, 0, 0) / 1000); // Today midnight timestamp

    // 3. Scan Each Form
    for (const form of formsData.data) {
        let url = `https://graph.facebook.com/v19.0/${form.id}/leads?fields=created_time,id,field_data&filtering=[{"field":"time_created","operator":"GREATER_THAN","value":${since}}]&access_token=${PAGE_ACCESS_TOKEN}`;

        while (url) {
            const res = await fetch(url);
            const leadData = await res.json();

            if (!leadData.data || leadData.data.length === 0) break;

            for (const lead of leadData.data) {
                // Extract Info
                let name = '', phone = '', city = '', state = '';
                lead.field_data.forEach(f => {
                    if (f.name.includes('name')) name = f.values[0];
                    if (f.name.includes('phone') || f.name.includes('number')) phone = f.values[0];
                    if (f.name.includes('city')) city = f.values[0];
                    if (f.name.includes('state')) state = f.values[0];
                });

                if (!phone) continue;

                // Check Duplicate in DB
                const { data: exists } = await supabase.from('leads').select('id').eq('phone', phone).single();

                if (!exists) {
                    process.stdout.write('+'); // Visual Indicator

                    // Assign
                    const target = users[userIdx % users.length];

                    const { error } = await supabase.from('leads').insert({
                        name: name,
                        phone: phone,
                        city: city,
                        state: state,
                        source: `Meta - Digital Chirag (Recovered)`,
                        assigned_to: target.id,
                        status: 'Assigned',
                        created_at: lead.created_time,
                        assigned_at: new Date().toISOString() // IMPORTANT: Ensure visibility
                    });

                    if (!error) {
                        // Increment Counter
                        await supabase.rpc('increment_user_leads', { user_id: target.id });
                        userIdx++;
                        recoveredCount++;
                    }
                } else {
                    process.stdout.write('.'); // Dot for existing
                }
            }

            // Pagination
            url = leadData.paging?.next;
        }
    }

    console.log(`\n\n🎉 RECOVERY COMPLETE!`);
    console.log(`✅ Successfully added ${recoveredCount} MISSING leads.`);
    console.log(`ℹ️ Duplicate leads were skipped.`);
}

recoverLeads();
