/**
 * ╔════════════════════════════════════════════════════════════╗
 * ║  🔒 LOCKED - razorpay-webhook.ts v2.0                      ║
 * ║  Last Updated: January 5, 2025                             ║
 * ║  Production Payment Handler                                ║
 * ║                                                            ║
 * ║  ⚠️  ONLY 5 ACTIVE PLANS - NO LEGACY PLANS                ║
 * ╚════════════════════════════════════════════════════════════╝
 */

import crypto from 'crypto';

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// FINAL PLAN CONFIGURATION (Matches PRD)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
const PLAN_CONFIG: Record<string, {
  price: number;
  duration: number;
  dailyLeads: number;
  totalLeads: number;
  weight: number;
  maxReplacements: number;
}> = {
  // Monthly Plans
  'starter': {
    price: 999,
    duration: 10,
    dailyLeads: 5,
    totalLeads: 50,
    weight: 1,
    maxReplacements: 5
  },
  'supervisor': {
    price: 1999,
    duration: 15,
    dailyLeads: 7,
    totalLeads: 105,
    weight: 3,
    maxReplacements: 10
  },
  'manager': {
    price: 2999,
    duration: 20,
    dailyLeads: 8,
    totalLeads: 160,
    weight: 5,
    maxReplacements: 16
  },
  
  // 7-Day Booster Plans
  'weekly_boost': {
    price: 1999,
    duration: 7,
    dailyLeads: 12,
    totalLeads: 84,
    weight: 7,
    maxReplacements: 8
  },
  'turbo_boost': {
    price: 2499,
    duration: 7,
    dailyLeads: 14,
    totalLeads: 98,
    weight: 9,
    maxReplacements: 10
  }
  
  // ❌ REMOVED: 'professional' (old demo plan)
};

export default async function handler(req: any, res: any) {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Razorpay-Signature');

  if (req.method === 'OPTIONS') return res.status(200).end();
  
  // Health check
  if (req.method === 'GET') {
    return res.status(200).json({
      status: 'active',
      message: 'LeadFlow Webhook Ready (Production)',
      plans: Object.keys(PLAN_CONFIG),
      version: '2.0',
      timestamp: new Date().toISOString()
    });
  }

  if (req.method === 'POST') {
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📦 Webhook received:', req.body?.event);
    
    try {
      const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
      const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
      const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
      
      if (!supabaseUrl || !supabaseKey) {
        console.error('❌ Missing Supabase config');
        return res.status(500).json({ error: 'Server config error' });
      }

      // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
      // 1. Signature Verification (PRODUCTION)
      // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
      if (webhookSecret) {
        const signature = req.headers['x-razorpay-signature'];
        const body = JSON.stringify(req.body);
        const expectedSignature = crypto
          .createHmac('sha256', webhookSecret)
          .update(body)
          .digest('hex');
        
        if (signature !== expectedSignature) {
          console.error('❌ Invalid Signature');
          return res.status(401).json({ error: 'Invalid signature' });
        }
        
        console.log('✅ Signature verified');
      } else {
        console.warn('⚠️ Webhook secret not configured - SKIP IN PRODUCTION!');
      }

      // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
      // 2. Process Payment
      // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
      if (req.body?.event === 'payment.captured' || req.body?.event === 'payment.authorized') {
        const payment = req.body.payload?.payment?.entity;
        const userId = payment.notes?.user_id;
        const planName = (payment.notes?.plan_name || 'starter').toLowerCase().replace(/[\s-]+/g, '_');
        const userEmail = payment.notes?.user_email || payment.email || '';
        const amount = payment.amount / 100; // Paise to Rupees

        console.log('💳 Processing:', { userId, planName, amount });

        // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        // 3. Validate Plan (CRITICAL - Prevent fraud)
        // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        const config = PLAN_CONFIG[planName];
        
        if (!config) {
          console.error('❌ Invalid plan:', planName);
          return res.status(400).json({ 
            error: 'Invalid plan',
            plan: planName,
            availablePlans: Object.keys(PLAN_CONFIG)
          });
        }
        
        // Verify amount matches plan price
        if (amount !== config.price) {
          console.error('❌ Amount mismatch:', { expected: config.price, received: amount });
          return res.status(400).json({ 
            error: 'Amount mismatch',
            expected: config.price,
            received: amount
          });
        }
        
        console.log('✅ Plan validated:', planName, '₹' + amount);

        // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        // 4. Save Payment Record (Idempotency check)
        // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        const paymentCheckResp = await fetch(
          `${supabaseUrl}/rest/v1/payments?razorpay_payment_id=eq.${payment.id}&select=id`,
          {
            headers: { 
              'apikey': supabaseKey, 
              'Authorization': `Bearer ${supabaseKey}`
            }
          }
        );
        
        const existingPayments = await paymentCheckResp.json();
        
        if (existingPayments && existingPayments.length > 0) {
          console.log('⚠️ Payment already processed:', payment.id);
          return res.status(200).json({ success: true, message: 'Already processed' });
        }
        
        // Insert payment record
        await fetch(`${supabaseUrl}/rest/v1/payments`, {
          method: 'POST',
          headers: { 
            'apikey': supabaseKey, 
            'Authorization': `Bearer ${supabaseKey}`,
            'Content-Type': 'application/json',
            'Prefer': 'return=minimal'
          },
          body: JSON.stringify({
            user_id: userId || null,
            razorpay_payment_id: payment.id,
            amount: amount,
            plan_name: planName,
            payer_email: userEmail,
            status: 'captured',
            raw_payload: payment
          })
        });
        
        console.log('✅ Payment record saved');

        // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        // 5. Find User
        // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        let finalUserId = userId;
        
        if (!finalUserId && userEmail) {
          const userResp = await fetch(
            `${supabaseUrl}/rest/v1/users?email=eq.${encodeURIComponent(userEmail)}&select=id&limit=1`,
            { 
              headers: { 
                'apikey': supabaseKey, 
                'Authorization': `Bearer ${supabaseKey}` 
              } 
            }
          );
          const users = await userResp.json();
          if (users?.[0]) finalUserId = users[0].id;
        }
        
        if (!finalUserId) {
          console.error('❌ User not found');
          return res.status(400).json({ error: 'User not found' });
        }
        
        console.log('✅ User found:', finalUserId);

        // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        // 6. Calculate Validity
        // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        const now = new Date();
        const validUntil = new Date();
        validUntil.setDate(now.getDate() + config.duration);
        validUntil.setHours(23, 59, 59, 999); // End of day

        // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        // 7. Update User (Activate Plan)
        // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        const updateResp = await fetch(
          `${supabaseUrl}/rest/v1/users?id=eq.${finalUserId}`,
          {
            method: 'PATCH',
            headers: { 
              'apikey': supabaseKey, 
              'Authorization': `Bearer ${supabaseKey}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              plan_name: planName,
              payment_status: 'active',
              daily_limit: config.dailyLeads,
              plan_weight: config.weight,
              max_replacements: config.maxReplacements,
              valid_until: validUntil.toISOString(),
              leads_today: 0, // Reset counter
              updated_at: new Date().toISOString()
            })
          }
        );

        if (updateResp.ok) {
          console.log('✅ Plan Activated:', planName);
          console.log('   Daily Limit:', config.dailyLeads);
          console.log('   Weight:', config.weight);
          console.log('   Valid Until:', validUntil.toISOString());
          
          return res.status(200).json({ 
            success: true, 
            message: 'Plan Activated',
            plan: planName,
            validUntil: validUntil.toISOString()
          });
        } else {
          console.error('❌ User update failed');
          return res.status(500).json({ error: 'User update failed' });
        }
      }

      return res.status(200).json({ received: true });

    } catch (error: any) {
      console.error('❌ Webhook Error:', error.message);
      console.error('Stack:', error.stack);
      return res.status(500).json({ error: error.message });
    }
  }

  return res.status(405).end();
}
