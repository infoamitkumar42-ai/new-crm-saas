const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
    'https://vewqzsqddgmkslnuctvb.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZld3F6c3FkZGdta3NsbnVjdHZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczNDI3NzIyNiwiZXhwIjoyMDQ5ODUzMjI2fQ.LST6o4OQV55yp73knkZ5MlFH-2xXJjv0NlqCVzyyqTY'
);

async function analyzeQuotaUsers() {
    console.log('🔍 ANALYZING 73 USERS WHO EXCEEDED QUOTA\n');
    console.log('='.repeat(80));

    try {
        // Get users who exceeded quota
        const { data: users, error: usersError } = await supabase
            .from('users')
            .select('id, name, email, plan_name, total_leads_received, total_leads_promised, payment_status, is_active, created_at')
            .in('team_code', ['TEAMFIRE', 'TEAMRAJ', 'GJ01TEAMFIRE'])
            .not('total_leads_promised', 'is', null)
            .gt('total_leads_promised', 0)
            .gte('total_leads_received', 'total_leads_promised');

        if (usersError) {
            console.error('❌ Error:', usersError.message);
            return;
        }

        console.log(`\n📊 Found ${users.length} users who exceeded quota\n`);

        const report = {
            multiplePayments: [],
            pendingPayments: [],
            recentPayments: [],
            oldPayments: [],
            needsReview: []
        };

        // Analyze each user
        for (const user of users) {
            // Get payment count
            const { data: completedPayments } = await supabase
                .from('payments')
                .select('id, amount, created_at, status')
                .eq('user_id', user.id)
                .eq('status', 'completed')
                .order('created_at', { descending: true });

            const { data: pendingPayments } = await supabase
                .from('payments')
                .select('id')
                .eq('user_id', user.id)
                .eq('status', 'pending');

            const { data: allPayments } = await supabase
                .from('payments')
                .select('created_at')
                .eq('user_id', user.id)
                .order('created_at', { descending: true })
                .limit(1);

            const userAnalysis = {
                name: user.name,
                email: user.email,
                plan: user.plan_name,
                received: user.total_leads_received,
                quota: user.total_leads_promised,
                exceeded: user.total_leads_received - user.total_leads_promised,
                completedPayments: completedPayments?.length || 0,
                pendingPayments: pendingPayments?.length || 0,
                lastPayment: allPayments?.[0]?.created_at,
                totalPaid: completedPayments?.reduce((sum, p) => sum + (p.amount || 0), 0) || 0
            };

            // Categorize
            if (pendingPayments && pendingPayments.length > 0) {
                report.pendingPayments.push(userAnalysis);
            } else if (completedPayments && completedPayments.length > 1) {
                report.multiplePayments.push(userAnalysis);
            } else if (allPayments && allPayments[0]) {
                const daysSincePayment = Math.floor((Date.now() - new Date(allPayments[0].created_at).getTime()) / (1000 * 60 * 60 * 24));

                if (daysSincePayment < 7) {
                    report.recentPayments.push(userAnalysis);
                } else if (daysSincePayment > 30) {
                    report.oldPayments.push(userAnalysis);
                } else {
                    report.needsReview.push(userAnalysis);
                }
            } else {
                report.needsReview.push(userAnalysis);
            }
        }

        // Generate Report
        console.log('\n📋 ANALYSIS REPORT\n');
        console.log('='.repeat(80));

        console.log(`\n🔴 MULTIPLE PAYMENTS - LIKELY RENEWED (${report.multiplePayments.length} users)`);
        console.log('   ⚠️  ACTION: Update total_leads_promised\n');
        if (report.multiplePayments.length > 0) {
            console.table(report.multiplePayments.slice(0, 10).map(u => ({
                Name: u.name,
                Email: u.email,
                Payments: u.completedPayments,
                Received: u.received,
                Quota: u.quota,
                'Over By': u.exceeded,
                'Total Paid': `₹${u.totalPaid}`
            })));
            if (report.multiplePayments.length > 10) {
                console.log(`   ... and ${report.multiplePayments.length - 10} more\n`);
            }
        } else {
            console.log('   ✅ None found\n');
        }

        console.log(`\n🟡 PENDING PAYMENTS (${report.pendingPayments.length} users)`);
        console.log('   ⚠️  ACTION: Verify payment status first\n');
        if (report.pendingPayments.length > 0) {
            console.table(report.pendingPayments.slice(0, 5).map(u => ({
                Name: u.name,
                Email: u.email,
                Pending: u.pendingPayments,
                Received: u.received,
                Quota: u.quota
            })));
        } else {
            console.log('   ✅ None found\n');
        }

        console.log(`\n🟠 RECENT PAYMENTS (<7 days) (${report.recentPayments.length} users)`);
        console.log('   ⚠️  ACTION: Verify if renewal\n');
        if (report.recentPayments.length > 0) {
            console.table(report.recentPayments.slice(0, 5).map(u => ({
                Name: u.name,
                Email: u.email,
                'Last Payment': new Date(u.lastPayment).toLocaleDateString(),
                Received: u.received,
                Quota: u.quota
            })));
        } else {
            console.log('   ✅ None found\n');
        }

        console.log(`\n🟢 OLD PAYMENTS (30+ days) (${report.oldPayments.length} users)`);
        console.log('   ✅ OK to keep blocked\n');
        if (report.oldPayments.length > 0) {
            console.log(`   ${report.oldPayments.length} users - genuinely exhausted quota\n`);
        }

        console.log(`\n🟡 NEEDS MANUAL REVIEW (${report.needsReview.length} users)`);
        console.log('   ⚠️  ACTION: Case-by-case review\n');
        if (report.needsReview.length > 0) {
            console.table(report.needsReview.slice(0, 5).map(u => ({
                Name: u.name,
                Email: u.email,
                Payments: u.completedPayments,
                Received: u.received,
                Quota: u.quota
            })));
        }

        // Summary
        console.log('\n' + '='.repeat(80));
        console.log('📊 SUMMARY\n');
        console.log(`Total Users Blocked: ${users.length}`);
        console.log(`🔴 Need Quota Update: ${report.multiplePayments.length}`);
        console.log(`🟡 Need Verification: ${report.pendingPayments.length + report.recentPayments.length + report.needsReview.length}`);
        console.log(`🟢 OK to Block: ${report.oldPayments.length}`);

        // Save full report
        const fs = require('fs');
        fs.writeFileSync('QUOTA_ANALYSIS_REPORT.json', JSON.stringify(report, null, 2));
        console.log('\n✅ Full report saved to: QUOTA_ANALYSIS_REPORT.json');

    } catch (err) {
        console.error('\n❌ Error:', err.message);
    }
}

analyzeQuotaUsers();
