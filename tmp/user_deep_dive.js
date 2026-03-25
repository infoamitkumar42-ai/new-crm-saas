import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://vewqzsqddgmkslnuctvb.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDUzMDQ2MiwiZXhwIjoyMDgwMTA2NDYyfQ.pAgMGN6MtKm1A3fsKr1GIt8-qmKYhwFjSt92L_6_7us';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

const targetEmails = [
    'samandeepkaur1216@gmail.com', // SAMAN
    'princyrani303@gmail.com',      // Princy
    'gurnoor1311singh@gmail.com',   // Mandeep (turbo)
    'sipreet73@gmail.com',          // Sipreet
    'sranjasnoor11@gmail.com'       // Jasnoor
];

async function deepDive() {
    console.log('--- STEP 3: SPECIFIC USER DEEP DIVE ---');
    
    for (const email of targetEmails) {
        console.log(`\nChecking user: ${email}`);
        
        const { data: user, error: userErr } = await supabase
            .from('users')
            .select('*')
            .eq('email', email)
            .single();
        
        if (userErr || !user) {
            console.error(`User ${email} not found or error:`, userErr);
            continue;
        }
        
        console.log(`User ID: ${user.id}, Name: ${user.name}`);
        console.log(`Counter: ${user.total_leads_received}, Promised: ${user.total_leads_promised}`);
        
        // Count via assigned_to
        const { count: assignedCount } = await supabase
            .from('leads')
            .select('*', { count: 'exact', head: true })
            .eq('assigned_to', user.id);
            
        // Count via user_id
        const { count: user_idCount } = await supabase
            .from('leads')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', user.id);

        // Count either
        const { count: eitherCount } = await supabase
            .from('leads')
            .select('*', { count: 'exact', head: true })
            .or(`assigned_to.eq.${user.id},user_id.eq.${user.id}`);

        console.log(`Actual (assigned_to): ${assignedCount}`);
        console.log(`Actual (user_id): ${user_idCount}`);
        console.log(`Actual (either): ${eitherCount}`);
        
        // Latest 5 leads for this user
        const { data: latestLeads } = await supabase
            .from('leads')
            .select('id, name, phone, created_at, status, user_id, assigned_to')
            .or(`assigned_to.eq.${user.id},user_id.eq.${user.id}`)
            .order('created_at', { ascending: false })
            .limit(5);
        
        if (latestLeads && latestLeads.length > 0) {
            console.table(latestLeads);
        } else {
            console.log('No leads found in DB for this user.');
        }
    }
}

deepDive().catch(console.error);
