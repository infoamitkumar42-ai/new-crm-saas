const { createClient } = require('@supabase/supabase-js');
const s = createClient('https://vewqzsqddgmkslnuctvb.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDUzMDQ2MiwiZXhwIjoyMDgwMTA2NDYyfQ.pAgMGN6MtKm1A3fsKr1GIt8-qmKYhwFjSt92L_6_7us');

(async () => {
    try {
        const uId = 'f58629bd-e6d2-4ea3-a3f5-5c8e25735385';

        // 1. Check historical leads
        const { data: lHistory } = await s.from('leads')
            .select('created_at, source')
            .eq('assigned_to', uId)
            .order('created_at', { ascending: true });

        console.log('--- LEAD HISTORY ---');
        if (lHistory) {
            const countsByDate = {};
            lHistory.forEach(l => {
                const date = l.created_at.split('T')[0];
                countsByDate[date] = (countsByDate[date] || 0) + 1;
            });
            console.log('Counts by Date:', countsByDate);
            console.log('Total Leads:', lHistory.length);
        }

        // 2. Search for any payment/plan records
        const { data: payments } = await s.from('users').select('metadata').eq('id', uId).maybeSingle();
        console.log('User Metadata:', JSON.stringify(payments, null, 2));

        // 3. Look for "plans" or "subscriptions" related tables
        const { data: tables } = await s.rpc('exec_sql', {
            sql_query: "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'"
        }).catch(() => ({ data: [] }));

        if (tables) {
            const relevant = tables.filter(t =>
                t.table_name.includes('plan') ||
                t.table_name.includes('pay') ||
                t.table_name.includes('sub')
            );
            console.log('Relevant Tables:', relevant.map(t => t.table_name));
        }

    } catch (e) {
        console.error('Fatal:', e);
    }
})();
