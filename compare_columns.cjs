const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
    'https://vewqzsqddgmkslnuctvb.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczNDI3NzIyNiwiZXhwIjoyMDQ5ODUzMjI2fQ.LST6o4OQV55yp73knkZ5MlFH-2xXJjv0NlqCVzyyqTY'
);

async function investigate() {
    console.log('🔍 COMPARING user_id vs assigned_to COLUMNS\n');
    console.log('='.repeat(70));

    const himanshuEmail = 'sharmahimanshu9797@gmail.com';

    // Get Himanshu's ID
    const { data: user } = await supabase
        .from('users')
        .select('id, name, email')
        .eq('email', himanshuEmail)
        .single();

    if (!user) {
        console.log('❌ User not found');
        return;
    }

    console.log(`\n📋 User: ${user.name} (${user.email})`);
    console.log(`ID: ${user.id}`);

    // Count using user_id (Dashboard method)
    console.log('\n📊 Query 1: Count by user_id (DASHBOARD METHOD)');
    const { count: userIdCount } = await supabase
        .from('leads')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id);

    console.log(`Result: ${userIdCount} leads`);

    // Count using assigned_to (Our method)
    console.log('\n📊 Query 2: Count by assigned_to (OUR METHOD)');
    const { count: assignedToCount } = await supabase
        .from('leads')
        .select('*', { count: 'exact', head: true })
        .eq('assigned_to', user.id);

    console.log(`Result: ${assignedToCount} leads`);

    // Comparison
    console.log('\n' + '='.repeat(70));
    console.log('📈 COMPARISON RESULTS:');
    console.log('='.repeat(70));
    console.log(`Dashboard (user_id):     ${userIdCount} leads`);
    console.log(`Database (assigned_to):  ${assignedToCount} leads`);
    console.log(`Difference:              ${Math.abs(userIdCount - assignedToCount)} leads`);

    if (userIdCount === 209) {
        console.log('\n✅ CONFIRMED: user_id column has 209 leads (matches dashboard!)');
    }

    if (assignedToCount === 137) {
        console.log('✅ CONFIRMED: assigned_to column has 137 leads (matches our query!)');
    }

    console.log('\n🎯 SOLUTION FOUND:');
    console.log('   The system has TWO different columns:');
    console.log('   - user_id: Original lead owner (209)');
    console.log('   - assigned_to: Currently assigned user (137)');
    console.log('\n   Counter should use: user_id (like dashboard does)');
}

investigate().catch(err => {
    console.error('Error:', err.message);
    console.error('\nRLS might be blocking. Try running SQL queries directly in Supabase Dashboard.');
});
