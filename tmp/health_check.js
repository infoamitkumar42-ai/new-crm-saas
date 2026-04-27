import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://vewqzsqddgmkslnuctvb.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDUzMDQ2MiwiZXhwIjoyMDgwMTA2NDYyfQ.pAgMGN6MtKm1A3fsKr1GIt8-qmKYhwFjSt92L_6_7us';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function checkHealth() {
    console.log('--- STEP 1: DATABASE HEALTH CHECK ---');
    
    // 1A: Total leads
    const { count: totalLeads } = await supabase.from('leads').select('*', { count: 'exact', head: true });
    
    // 1B: Leads with assigned_to set
    const { count: assignedLeads } = await supabase.from('leads').select('*', { count: 'exact', head: true }).not('assigned_to', 'is', null);
    
    // 1C: Leads with user_id set
    const { count: userIdLeads } = await supabase.from('leads').select('*', { count: 'exact', head: true }).not('user_id', 'is', null);
    
    // 1D: Mismatch check (more complex, will do in next script or with more queries)
    
    // 1E: Leads created today (18 March 2026)
    // The user IST time is 2026-03-18 18:30:29+05:30
    const startOfDay = '2026-03-18T00:00:00+05:30'; 
    const { count: todayLeads } = await supabase.from('leads').select('*', { count: 'exact', head: true }).gte('created_at', startOfDay);
    
    const { data: uniqueUsers } = await supabase.from('leads').select('assigned_to').gte('created_at', startOfDay).not('assigned_to', 'is', null);
    const uniqueUsersAssigned = new Set(uniqueUsers?.map(l => l.assigned_to)).size;

    console.log(`Total Leads: ${totalLeads}`);
    console.log(`Assigned Leads (assigned_to): ${assignedLeads}`);
    console.log(`User ID Leads (user_id): ${userIdLeads}`);
    console.log(`Today's Leads: ${todayLeads}`);
    console.log(`Unique Users Assigned Today: ${uniqueUsersAssigned}`);
}

checkHealth().catch(console.error);
