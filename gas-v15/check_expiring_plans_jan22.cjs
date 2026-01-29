const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function checkExpiringPlans() {
    const today = new Date().toISOString().split('T')[0]; // 2026-01-22

    // Fetch all active users with a plan
    const { data: users, error } = await supabase
        .from('users')
        .select('id, name, email, phone, plan_name, valid_until, is_active, payment_status')
        .eq('is_active', true)
        .eq('payment_status', 'active');

    if (error) {
        console.error('Error fetching users:', error);
        return;
    }

    console.log(`Checking ${users.length} active users for expiration (Today: ${today})...\n`);

    const expired = [];
    const expiringToday = [];
    const expiringSoon = [];

    users.forEach(user => {
        if (!user.valid_until) return;

        const validUntil = new Date(user.valid_until);
        const validUntilStr = validUntil.toISOString().split('T')[0];

        // Check if expired (before today)
        // Check if expires TODAY (2026-01-22)

        if (validUntilStr < today) {
            expired.push({ ...user, date: validUntilStr });
        } else if (validUntilStr === today) {
            expiringToday.push({ ...user, date: validUntilStr });
        } else {
            // Check if expires tomorrow just for info
            const tomorrow = new Date();
            tomorrow.setDate(tomorrow.getDate() + 1);
            const tomorrowStr = tomorrow.toISOString().split('T')[0];
            if (validUntilStr === tomorrowStr) {
                expiringSoon.push({ ...user, date: validUntilStr });
            }
        }
    });

    console.log('=== 🛑 EXPIRED (Should be stopped immediately) ===');
    if (expired.length === 0) console.log('None');
    expired.forEach(u => console.log(`- ${u.name} (${u.phone}) - Expired: ${u.date}`));

    console.log('\n=== ⚠️ EXPIRING TODAY (Stop tonight or waiting renewal) ===');
    if (expiringToday.length === 0) console.log('None');
    expiringToday.forEach(u => console.log(`- ${u.name} (${u.phone}) - Expires: ${u.date}`));

    console.log('\n=== ⏳ EXPIRING TOMORROW (Heads up) ===');
    if (expiringSoon.length === 0) console.log('None');
    expiringSoon.forEach(u => console.log(`- ${u.name} (${u.phone}) - Expires: ${u.date}`));
}

checkExpiringPlans();
