
const { createClient } = require('@supabase/supabase-js');
const SUPABASE_URL = 'https://vewqzsqddgmkslnuctvb.supabase.co';
const ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ1MzA0NjIsImV4cCI6MjA4MDEwNjQ2Mn0.g-e8YNzEy0Z5ul1RGAhBMDj41TtWGuNPEzZz4XEGPg4";
const supabase = createClient(SUPABASE_URL, ANON_KEY);

async function checkLeadsInTable() {
    const sumitId = 'ff407842-0892-43b2-81fd-bdcc20a23152';
    console.log(`🔍 Checking leads table for user ID: ${sumitId}`);

    // Check assigned_to
    const { data: leadsAssigned } = await supabase.from('leads').select('id, name, status, assigned_to, user_id').eq('assigned_to', sumitId);
    console.log(`Count assigned_to: ${leadsAssigned?.length || 0}`);
    leadsAssigned?.forEach(l => console.log(` - ${l.name} (ID: ${l.id})`));

    // Check user_id
    const { data: leadsOwned } = await supabase.from('leads').select('id, name, status, assigned_to, user_id').eq('user_id', sumitId);
    console.log(`Count user_id: ${leadsOwned?.length || 0}`);
    leadsOwned?.forEach(l => console.log(` - ${l.name} (ID: ${l.id})`));
}

checkLeadsInTable();
