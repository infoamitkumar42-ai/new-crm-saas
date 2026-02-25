const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = "https://vewqzsqddgmkslnuctvb.supabase.co";
const SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDUzMDQ2MiwiZXhwIjoyMDgwMTA2NDYyfQ.pAgMGN6MtKm1A3fsKr1GIt8-qmKYhwFjSt92L_6_7us";
const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

const emails = [
    'saijelgoel4@gmail.com',
    'ravenjeetkaur@gmail.com',
    'amritpalkaursohi358@gmail.com',
    'preetibrarbrar7@gmail.com'
];

async function main() {
    console.log("🛑 Stopping 4 over-quota users...\n");
    for (let email of emails) {
        const { data: user } = await supabase.from('users').select('id, name').eq('email', email).single();
        if (!user) { console.log(`❌ Not found: ${email}`); continue; }

        const { error } = await supabase.from('users').update({ is_active: false }).eq('id', user.id);
        if (!error) console.log(`✅ Stopped: ${user.name} (${email})`);
        else console.log(`❌ Error: ${user.name}: ${error.message}`);
    }
    console.log("\n🎉 Done!");
}

main().catch(console.error);
