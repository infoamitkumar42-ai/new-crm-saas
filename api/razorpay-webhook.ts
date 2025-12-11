import type { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

// Environment Variables
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY; 
const WEBHOOK_SECRET = process.env.VITE_RAZORPAY_WEBHOOK_SECRET;

// Admin Client (Database Update ke liye)
const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_KEY!);

// Helper: Plan ID se Duration aur Limit nikalo
const getPlanDetails = (planId: string) => {
  // Monthly Plans
  if (planId === 'starter_monthly') return { days: 30, limit: 2, type: 'monthly' };
  if (planId === 'growth_monthly') return { days: 30, limit: 5, type: 'monthly' };
  if (planId === 'team_monthly') return { days: 30, limit: 12, type: 'monthly' };
  
  // Weekly Boost Packs
  if (planId === 'boost_a') return { days: 7, limit: 10, type: 'boost' }; // Fast Start
  if (planId === 'boost_b') return { days: 7, limit: 20, type: 'boost' }; // Turbo Weekly (20 leads/day)
  
  // Future proofing (Agar baad mein C plan laye)
  if (planId === 'boost_c') return { days: 7, limit: 25, type: 'boost' };

  // Default Fallback (Safety ke liye Starter plan)
  return { days: 30, limit: 2, type: 'monthly' };
};

// NextJS ko bolo ki Body Parse na kare (Signature verify karne ke liye Raw Body chahiye)
export const config = {
  api: {
    bodyParser: false,
  },
};

async function buffer(readable: any) {
  const chunks = [];
  for await (const chunk of readable) {
    chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
  }
  return Buffer.concat(chunks);
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    if (!WEBHOOK_SECRET) {
      console.error('CRITICAL: RAZORPAY_WEBHOOK_SECRET is missing in .env');
      return res.status(500).json({ status: 'error', message: 'Configuration error' });
    }

    const signature = req.headers['x-razorpay-signature'] as string;
    
    try {
      // 1. Raw Body Read karo (Signature Verification ke liye)
      const buf = await buffer(req);
      const rawBody = buf.toString();

      // 2. Verify Signature (Security Check)
      const shasum = crypto.createHmac('sha256', WEBHOOK_SECRET);
      shasum.update(rawBody);
      const digest = shasum.digest('hex');

      if (digest !== signature) {
        console.error("❌ Invalid Signature. Fake request blocked.");
        return res.status(400).json({ status: 'invalid_signature' });
      }

      // 3. Parse Event
      const event = JSON.parse(rawBody);

      // 4. Sirf Payment Success par kaam karo
      if (event.event === 'payment.captured') {
        const payload = event.payload.payment.entity;
        
        const email = payload.email || payload.notes?.email; 
        const amount = payload.amount;
        const razorpayId = payload.id;
        // Notes se Plan ID nikalo (Jo humne create-order mein bheja tha)
        const planId = payload.notes?.planId;
        const userId = payload.notes?.userId; // Zaroori hai user dhoondne ke liye
        
        console.log(`💰 Payment: ₹${amount/100} | User: ${userId} | Plan: ${planId}`);

        // Plan Details Calculate karo
        const { days, limit, type } = getPlanDetails(planId);

        // Expiry Date Set karo
        const validUntil = new Date();
        validUntil.setDate(validUntil.getDate() + days);

        // User Dhundo (ID se best hai, fallback email)
        let userQuery = supabase.from('users').select('id');
        
        if (userId) {
            userQuery = userQuery.eq('id', userId);
        } else if (email) {
            userQuery = userQuery.eq('email', email);
        } else {
            console.error("❌ No User ID or Email in payment notes");
            return res.status(400).json({ error: "User unknown" });
        }

        const { data: user } = await userQuery.single();

        if (user) {
            // 5. User ko Update karo (Activate Plan)
             const { error: updateError } = await supabase
            .from('users')
            .update({ 
                payment_status: 'active',
                valid_until: validUntil.toISOString(),
                daily_limit: limit,
                // Agar DB mein plan_id column hai to update karo, varna hata dena
                // plan_id: planId 
            })
            .eq('id', user.id);
            
            if (updateError) {
                console.error('❌ Database update failed:', updateError);
                return res.status(500).json({ error: 'DB update failed' });
            }

            // 6. Payment Record karo
            await supabase.from('payments').insert({
              user_id: user.id,
              amount: amount,
              plan_type: type, // monthly or boost
              razorpay_id: razorpayId,
              status: 'success'
            });

            // 7. Log entry (Debugging ke liye)
            await supabase.from('logs').insert({
              user_id: user.id,
              action: 'plan_activated',
              details: { plan: planId, days: days, amount: amount, rzp_id: razorpayId }
            });
            
            console.log(`✅ Plan Activated: ${planId} for User ${user.id}`);
        } else {
            console.error("❌ User not found in DB for payment");
        }
      }
      
      // Razorpay ko bolo "Sab theek hai"
      res.json({ status: 'ok' });

    } catch (err: any) {
      console.error("Webhook Processing Error:", err.message);
      res.status(400).send(`Webhook Error: ${err.message}`);
    }
  } else {
    res.status(405).send('Method Not Allowed');
  }
}
