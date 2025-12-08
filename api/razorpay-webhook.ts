
import type { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

// Use process.env for Node environment, fallback to hardcoded value for reliability
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || "https://vewqzsqddgmkslnuctvb.supabase.co";
const SUPABASE_SERVICE_KEY = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || ""; 
const WEBHOOK_SECRET = process.env.VITE_RAZORPAY_WEBHOOK_SECRET || "mySuperSecretWebhookKey_123";

// Initialize Supabase Admin Client
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    if (!WEBHOOK_SECRET) {
      console.error('RAZORPAY_WEBHOOK_SECRET is not set');
      return res.status(500).json({ status: 'error', message: 'Configuration error' });
    }

    const signature = req.headers['x-razorpay-signature'] as string;
    
    // Create HMAC using the body
    const shasum = crypto.createHmac('sha256', WEBHOOK_SECRET);
    shasum.update(JSON.stringify(req.body));
    const digest = shasum.digest('hex');

    if (digest === signature) {
      const event = req.body.event;
      const payload = req.body.payload.payment.entity;

      if (event === 'payment.captured') {
        const email = payload.email || payload.notes?.email; 
        const amount = payload.amount;
        const razorpayId = payload.id;
        
        // Determine Plan Duration based on amount (paise)
        let durationDays = 0;
        let planType = '';
        
        if (amount === 4900) { durationDays = 1; planType = 'daily'; }
        else if (amount === 29900) { durationDays = 7; planType = 'weekly'; }
        else if (amount === 99900) { durationDays = 30; planType = 'monthly'; }
        else {
            durationDays = 1; 
            planType = 'daily';
        }

        const validUntil = new Date();
        validUntil.setDate(validUntil.getDate() + durationDays);

        const { data: user } = await supabase
          .from('users')
          .select('id')
          .eq('email', email)
          .single();

        if (user) {
             const { error: updateError } = await supabase
            .from('users')
            .update({ 
                payment_status: 'active',
                valid_until: validUntil.toISOString()
            })
            .eq('id', user.id);
            
            if (updateError) {
                console.error('Database update failed', updateError);
            }

            await supabase.from('payments').insert({
              user_id: user.id,
              amount: amount,
              plan_type: planType,
              razorpay_id: razorpayId,
            });

            await supabase.from('logs').insert({
              user_id: user.id,
              action: 'payment_webhook_captured',
              details: { 
                  amount: amount, 
                  plan: planType, 
                  razorpay_id: razorpayId 
              }
            });
        }
      }
      res.json({ status: 'ok' });
    } else {
      res.status(403).json({ status: 'invalid signature' });
    }
  } else {
    res.status(405).send('Method Not Allowed');
  }
}
