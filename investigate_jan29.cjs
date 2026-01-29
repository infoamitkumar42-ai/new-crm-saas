const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://vewqzsqddgmkslnuctvb.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDUzMDQ2MiwiZXhwIjoyMDgwMTA2NDYyfQ.pAgMGN6MtKm1A3fsKr1GIt8-qmKYhwFjSt92L_6_7us';
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function investigate() {
    console.log('--- USER INVESTIGATION ---');

    // 1. Harmandeep
    const { data: harman } = await supabase.from('users').select('*').eq('email', 'harmandeepkaurmanes790@gmail.com').single();
    if (harman) {
        console.log('Harmandeep:', {
            id: harman.id,
            plan: harman.plan_name,
            active: harman.is_active,
            total_leads_promised: harman.total_leads_promised,
            leads_today: harman.leads_today,
            daily_limit: harman.daily_limit,
            valid_until: harman.valid_until
        });

        const { count: hCount } = await supabase.from('leads').select('*', { count: 'exact', head: true }).eq('user_id', harman.id);
        console.log('Harmandeep Actual Leads Count:', hCount);

        const { data: pay } = await supabase.from('payments').select('*').eq('user_id', harman.id);
        console.log('Harmandeep Payments:', pay?.length);
    } else {
        console.log('Harmandeep NOT FOUND');
    }

    // 2. Suman
    const { data: sumans } = await supabase.from('users').select('*').ilike('name', '%Suman%');
    let sumanId = null;
    sumans.forEach(s => {
        console.log('Possible Suman:', s.name, s.email, s.plan_name, s.id);
        if (s.plan_name?.toLowerCase().includes('starter')) sumanId = s.id;
    });

    if (sumanId) {
        // 3. Duplicate Investigation (Shan Bhardwaj)
        console.log('\n--- LEAD INVESTIGATION (Shan Bhardwaj) ---');
        const { data: leads } = await supabase.from('leads')
            .select('*')
            .ilike('name', '%Shan Bhardwaj%')
            .order('created_at');

        console.log('Shan Bhardwaj Leads Found:', leads ? leads.length : 0);

        if (leads) {
            for (const l of leads) {
                console.log(`- ID: ${l.id}`);
                console.log(`  Phone: ${l.phone}`);
                console.log(`  User: ${l.user_id}`);
                console.log(`  Created: ${l.created_at}`);
                console.log(`  Source: ${l.source}`);
            }
        }
    }
}

investigate();
