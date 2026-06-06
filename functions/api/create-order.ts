/**
 * Cloudflare Pages Function: /api/create-order
 * Creates a Razorpay order server-side (keeps API secret safe)
 */

const corsHeaders = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

export const onRequestOptions = async () => {
  return new Response(null, { status: 204, headers: corsHeaders });
};

export const onRequestPost = async (context: any) => {
  const { request, env } = context;

  try {
    const { planId, price, userId } = await request.json();

    const keyId = env.RAZORPAY_KEY_ID;
    const keySecret = env.RAZORPAY_KEY_SECRET;

    if (!keyId || !keySecret) {
      console.error('[create-order] RAZORPAY_KEY_ID or RAZORPAY_KEY_SECRET missing');
      return new Response(JSON.stringify({ error: 'Server misconfiguration' }), { status: 500, headers: corsHeaders });
    }

    if (!planId || !price || !userId) {
      return new Response(JSON.stringify({ error: 'Missing planId, price, or userId' }), { status: 400, headers: corsHeaders });
    }

    const auth = btoa(`${keyId}:${keySecret}`);

    const razorpayRes = await fetch('https://api.razorpay.com/v1/orders', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        amount: Math.round(price * 100), // paise
        currency: 'INR',
        receipt: `order_${userId.substring(0, 8)}_${Date.now()}`,
        notes: {
          user_id: userId,
          plan_name: planId,
        },
      }),
    });

    if (!razorpayRes.ok) {
      const errText = await razorpayRes.text();
      console.error('[create-order] Razorpay API error:', errText);
      return new Response(JSON.stringify({ error: 'Failed to create Razorpay order' }), { status: 500, headers: corsHeaders });
    }

    const orderData = await razorpayRes.json();
    console.log(`[create-order] Order created: ${orderData.id} for user ${userId} plan ${planId}`);

    return new Response(JSON.stringify(orderData), { status: 200, headers: corsHeaders });

  } catch (err: any) {
    console.error('[create-order] Unexpected error:', err.message);
    return new Response(JSON.stringify({ error: 'Internal server error' }), { status: 500, headers: corsHeaders });
  }
};
