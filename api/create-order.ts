import type { NextApiRequest, NextApiResponse } from 'next';
import Razorpay from 'razorpay';

// Razorpay initialize karo
const razorpay = new Razorpay({
  key_id: process.env.VITE_RAZORPAY_KEY_ID!,
  key_secret: process.env.VITE_RAZORPAY_KEY_SECRET!,
});

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Sirf POST request allow karo
  if (req.method !== 'POST') return res.status(405).end();

  const { planId, price, userId } = req.body;

  if (!planId || !price || !userId) {
    return res.status(400).json({ error: "Missing fields" });
  }

  try {
    const options = {
      amount: Math.round(price * 100), // Razorpay paise mein leta hai (₹10 = 1000 paise)
      currency: "INR",
      receipt: `rcpt_${Date.now().toString().slice(-8)}`,
      notes: {
        userId: userId, // Webhook ke liye zaroori hai
        planId: planId
      }
    };

    const order = await razorpay.orders.create(options);
    res.status(200).json(order);

  } catch (error: any) {
    console.error("Razorpay Error:", error);
    res.status(500).json({ error: error.message });
  }
}
