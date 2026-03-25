import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://vewqzsqddgmkslnuctvb.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDUzMDQ2MiwiZXhwIjoyMDgwMTA2NDYyfQ.pAgMGN6MtKm1A3fsKr1GIt8-qmKYhwFjSt92L_6_7us';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function checkRLSPolicies() {
    console.log('--- POSTGRES RLS POLICIES ---');
    
    // We can't query pg_policies directly via REST API.
    // But we can check if we can see ALL leads by comparing count with a known large value.
    // Actually, I'll try to find an RPC that can run this or I'll just report what I can see.
    
    // Let's check for any leads where status is NOT one of the common ones.
    const { data: statuses } = await supabase.from('leads').select('status');
    const counts = {};
    statuses?.forEach(s => counts[s.status] = (counts[s.status] || 0) + 1);
    console.log('Lead Counts by Status (Total):');
    console.table(counts);

    // Let's check if there's a different user ID for SAMAN.
    // Sometimes users have duplicate accounts with same email (unlikely but possible).
    const { data: allUsers } = await supabase.from('users').select('id, email, name').ilike('email', '%saman%');
    console.log('\nUsers matching "saman":');
    console.table(allUsers);
}

checkRLSPolicies().catch(console.error);
