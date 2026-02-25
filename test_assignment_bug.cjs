const { createClient } = require('@supabase/supabase-js');
const s = createClient('https://vewqzsqddgmkslnuctvb.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDUzMDQ2MiwiZXhwIjoyMDgwMTA2NDYyfQ.pAgMGN6MtKm1A3fsKr1GIt8-qmKYhwFjSt92L_6_7us');

(async () => {
    try {
        const naziaId = '346618cd-11ea-420a-85d8-795725d70542'; // Nazia Begam (4/12)
        console.log('Testing assignment for Nazia (4/12)...');

        const { data, error } = await s.rpc('assign_lead_atomically', {
            p_lead_name: 'TEST NAZIA 4-12',
            p_phone: '1234560001',
            p_city: 'Test',
            p_source: 'Test',
            p_status: 'Assigned',
            p_user_id: naziaId,
            p_planned_limit: 12
        });

        if (error) {
            console.error('❌ RPC CRASHED:', error);
        } else {
            console.log('✅ RPC RESULT:', JSON.stringify(data, null, 2));
        }
    } catch (e) {
        console.error('❌ SCRIPT ERROR:', e);
    }
})();
