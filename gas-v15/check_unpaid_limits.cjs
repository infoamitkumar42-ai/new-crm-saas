
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL) process.exit(1);

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function checkUnpaidLimits() {
    console.log('🕵️ Checking "No Plan" Users Limits...');

    // Fetch users with NO PLAN or Empty Plan
    const { data: users, error } = await supabase
        .from('users')
        .select('name, plan_name, daily_limit')
        .or('plan_name.is.null,plan_name.eq.""')
        .eq('is_active', true)
        .limit(10);

    if (error) { console.error(error); return; }

    if (users.length === 0) {
        console.log('✅ No Active Unpaid Users found.');
    } else {
        console.log(`⚠️ Found Active Unpaid Users. Checking Limits:`);
        users.forEach(u => {
            console.log(`   - ${u.name.padEnd(20)} | Plan: [${u.plan_name}] | Limit: ${u.daily_limit}`);
        });

        const unsafe = users.filter(u => u.daily_limit > 0);
        if (unsafe.length > 0) {
            console.log(`\n🚨 DANGER: ${unsafe.length}/10 sampled users have Limit > 0.`);
            console.log('   These users WILL receive leads once Paid users complete Round 1.');
        } else {
            console.log('\n✅ Safe. All sampled limits are 0.');
        }
    }
}

checkUnpaidLimits();
