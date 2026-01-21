
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL) process.exit(1);

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function checkHimanshu() {
    console.log('🔍 Searching for "Himanshu"...');

    const { data: users, error } = await supabase
        .from('users')
        .select('id, name, leads_today, daily_limit, is_active')
        .ilike('name', '%Himanshu%');

    if (error) console.error(error);
    else {
        console.table(users);
        users.forEach(u => {
            console.log(`ID: ${u.id} | Name: "${u.name}" | Leads: ${u.leads_today} | Active: ${u.is_active}`);
        });
    }
}

checkHimanshu();
