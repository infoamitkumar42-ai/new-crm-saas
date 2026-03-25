import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

// Parse .env manually
const envPath = path.resolve(process.cwd(), '.env');
const envContent = fs.readFileSync(envPath, 'utf8');
const envUrl = envContent.match(/VITE_SUPABASE_URL=(.*)/)?.[1];
const envKey = envContent.match(/SUPABASE_SERVICE_ROLE_KEY=(.*)/)?.[1];

const supabaseUrl = envUrl || 'https://api.leadflowcrm.in';
const supabaseKey = envKey;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing URL or Key");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function runAudit() {
  try {
    console.log("Fetching active users...");
    const { data: users, error: userError } = await supabase
      .from('users')
      .select('id, email, plan_name, total_leads_received, total_leads_promised, daily_limit, is_active, payment_status')
      .eq('is_active', true)
      .eq('payment_status', 'active');
      
    if (userError) throw userError;
    
    const userIds = users.map(u => u.id);
    console.log(`Found ${users.length} active users.`);

    // Fetch leads
    console.log("Fetching leads...");
    const { data: leads, error: leadsError } = await supabase
      .from('leads')
      .select('id, assigned_to, created_at')
      .in('assigned_to', userIds);
      
    if (leadsError) throw leadsError;

    // Fetch payments
    console.log("Fetching payments...");
    const { data: payments, error: paymentsError } = await supabase
      .from('payments')
      .select('id, user_id, amount, status, created_at, plan_name')
      .eq('status', 'captured')
      .in('user_id', userIds);
      
    if (paymentsError) throw paymentsError;

    const report = {
      B1_Mismatches: [],
      B2_Payments: [],
      B4_PlanSummary: {},
      B5_ExpiredShouldBeInactive: [],
      B6_LatestPaymentLeads: []
    };

    // Process B1, B2, B5, B6
    for (const u of users) {
      const uLeads = leads.filter(l => l.assigned_to === u.id);
      const uPayments = payments.filter(p => p.user_id === u.id).sort((a,b) => new Date(b.created_at) - new Date(a.created_at));
      
      const mismatch = (u.total_leads_received || 0) - uLeads.length;
      report.B1_Mismatches.push({
        email: u.email,
        plan: u.plan_name,
        counter: u.total_leads_received || 0,
        promised: u.total_leads_promised || 0,
        actual_rows: uLeads.length,
        mismatch: mismatch
      });

      const totalPaid = uPayments.reduce((sum, p) => sum + Number(p.amount), 0);
      report.B2_Payments.push({
        email: u.email,
        plan: u.plan_name,
        promised: u.total_leads_promised || 0,
        total_payments: uPayments.length,
        total_paid: totalPaid,
        promised_per_payment: uPayments.length > 0 ? (u.total_leads_promised || 0) / uPayments.length : 0
      });

      if ((u.total_leads_received || 0) >= (u.total_leads_promised || 0) && (u.total_leads_promised || 0) > 0) {
        report.B5_ExpiredShouldBeInactive.push({
          email: u.email,
          plan: u.plan_name,
          received: u.total_leads_received,
          promised: u.total_leads_promised
        });
      }

      if (uPayments.length > 0) {
        const lastPaymentDate = new Date(uPayments[0].created_at);
        const leadsSince = uLeads.filter(l => new Date(l.created_at) >= lastPaymentDate).length;
        report.B6_LatestPaymentLeads.push({
          email: u.email,
          plan: u.plan_name,
          promised: u.total_leads_promised,
          all_time_counter: u.total_leads_received,
          last_payment_date: uPayments[0].created_at,
          leads_since_last_payment: leadsSince,
          pre_payment_leads: (u.total_leads_received || 0) - leadsSince
        });
      }

      // B4 Plan Summary prep
      if (!report.B4_PlanSummary[u.plan_name]) {
        report.B4_PlanSummary[u.plan_name] = { users: 0, sum_promised: 0, min_promised: 999999, max_promised: 0, sum_received: 0, over_quota: 0 };
      }
      const pSummary = report.B4_PlanSummary[u.plan_name];
      pSummary.users++;
      pSummary.sum_promised += (u.total_leads_promised || 0);
      pSummary.sum_received += (u.total_leads_received || 0);
      if ((u.total_leads_promised || 0) < pSummary.min_promised) pSummary.min_promised = u.total_leads_promised || 0;
      if ((u.total_leads_promised || 0) > pSummary.max_promised) pSummary.max_promised = u.total_leads_promised || 0;
      if ((u.total_leads_received || 0) > (u.total_leads_promised || 0)) pSummary.over_quota++;
    }

    // Sort and finalize B1
    report.B1_Mismatches.sort((a,b) => b.mismatch - a.mismatch);

    // Finalize B4
    for (const plan in report.B4_PlanSummary) {
      const s = report.B4_PlanSummary[plan];
      s.avg_promised = s.sum_promised / s.users;
      s.avg_received = s.sum_received / s.users;
    }

    fs.writeFileSync('TEMP_AUDIT_RESULT.json', JSON.stringify(report, null, 2));
    console.log("Audit complete! Saved to TEMP_AUDIT_RESULT.json");

  } catch (err) {
    console.error("Error:", err);
  }
}

runAudit();
