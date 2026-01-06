/**
 * ╔════════════════════════════════════════════════════════════╗
 * ║  🔒 LOCKED - api/create-order.ts v2.0                      ║
 * ║  Locked Date: January 6, 2025                              ║
 * ║  Status: STABLE - AUTO-CAPTURE ENABLED                     ║
 * ║                                                            ║
 * ║  Features:                                                 ║
 * ║  - ✅ Server-side Razorpay Order Creation                  ║
 * ║  - ✅ Auto-Capture (payment_capture: 1)                    ║
 * ║  - ✅ Debug Logging for Vercel                             ║
 * ║  - ✅ Strict Validation                                    ║
 * ║                                                            ║
 * ║  ⚠️  DO NOT REMOVE 'payment_capture: 1'                    ║
 * ╚════════════════════════════════════════════════════════════╝
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import Razorpay from 'razorpay';

// Initialize Razorpay Instance with Secure Backend Keys
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID!,
  key_secret: process.env.RAZORPAY_KEY_SECRET!,
});

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // 1. Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { planId, price, userId } = req.body;

    // 2. Debug Log: Incoming Request
    console.log("📝 Creating Order Request:", { planId, price, userId });

    // 3. Validation
    if (!planId || !price || !userId) {
      console.error("❌ Missing required fields");
      return res.status(400).json({ error: "Missing fields: planId, price, or userId is empty" });
    }

    // 4. Create Order Options
    const options = {
      amount: Math.round(price * 100), // Convert Rupee to Paise
      currency: "INR",
      receipt: `rcpt_${Date.now().toString().slice(-8)}`,
      payment_capture: 1, // 🔥 CRITICAL: Auto-capture payment (No manual action needed)
      notes: {
        userId: String(userId),
        planId: String(planId)
      }
    };

    // 5. Call Razorpay API
    const order = await razorpay.orders.create(options);
    
    console.log("✅ Order Created Successfully:", order.id);
    
    // 6. Send Response
    res.status(200).json(order);

  } catch (error: any) {
    console.error("🔥 Razorpay API Error:", error);
    
    // Send detailed error for debugging
    res.status(500).json({ 
      error: error.message || "Something went wrong creating the order",
      details: error
    });
  }
}
