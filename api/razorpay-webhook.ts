import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'

// Plan Configuration
const PLANS: Record<string, { daily_limit: number; duration_days: number; type: string }> = {
  // Monthly Plans
  'new_member': { daily_limit: 2, duration_days: 30, type: 'monthly' },
  'supervisor': { daily_limit: 4, duration_days: 30, type: 'monthly' },
  'manager': { daily_limit: 7, duration_days: 30, type: 'monthly' },
  
  // Boost Packs
  'boost_a': { daily_limit: 10, duration_days: 7, type: 'boost' },
  'boost_b': { daily_limit: 17, duration_days: 7, type: 'boost' },
  'boost_c': { daily_limit: 26, duration_days: 7, type: 'boost' },
  
  // Alternative names
  'starter': { daily_limit: 10, duration_days: 30, type: 'monthly' },
  'fast_start': { daily_limit: 5, duration_days: 7, type: 'boost' },
  'turbo_weekly': { daily_limit: 20, duration_days: 7, type: 'boost' },
  'max_blast': { daily_limit: 35, duration_days: 7, type: 'boost' },
}

// Verify Razorpay Webhook Signature
function verifySignature(body: string, signature: string, secret: string): boolean {
  try {
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(body)
      .digest('hex')
    return expectedSignature === signature
  } catch (error) {
    console.error('Signature verification error:', error)
    return false
  }
}

// GET - Health check
export async function GET() {
  return NextResponse.json({
    status: 'active',
    message: 'Razorpay webhook endpoint is running',
    timestamp: new Date().toISOString(),
    plans: Object.keys(PLANS),
    env_check: {
      supabase_url: !!process.env.VITE_SUPABASE_URL,
      service_key: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
      webhook_secret: !!process.env.RAZORPAY_WEBHOOK_SECRET
    }
  })
}

// POST - Handle webhook
export async function POST(req: NextRequest) {
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log('📦 Razorpay Webhook Received')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')

  try {
    // Get environment variables
    const supabaseUrl = process.env.VITE_SUPABASE_URL
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET

    // Check required env vars
    if (!supabaseUrl || !supabaseKey) {
      console.error('❌ Missing Supabase credentials')
      console.error('VITE_SUPABASE_URL:', !!supabaseUrl)
      console.error('SUPABASE_SERVICE_ROLE_KEY:', !!supabaseKey)
      return NextResponse.json(
        { error: 'Server configuration error - Missing Supabase credentials' },
        { status: 500 }
      )
    }

    // Get request body
    const body = await req.text()
    
    // Verify webhook signature (if secret is configured)
    if (webhookSecret) {
      const signature = req.headers.get('x-razorpay-signature') || ''
      
      if (signature && !verifySignature(body, signature, webhookSecret)) {
        console.error('❌ Invalid webhook signature')
        return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
      }
    }

    // Parse payload
    let payload
    try {
      payload = JSON.parse(body)
    } catch (e) {
      console.error('❌ Invalid JSON payload')
      return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
    }

    console.log('📋 Event:', payload.event)

    // Handle payment.captured
    if (payload.event === 'payment.captured') {
      const payment = payload.payload?.payment?.entity

      if (!payment) {
        console.error('❌ No payment entity found')
        return NextResponse.json({ error: 'Invalid payment data' }, { status: 400 })
      }

      // Extract data from notes
      const userId = payment.notes?.user_id
      const planName = payment.notes?.plan_name || payment.notes?.plan
      const userEmail = payment.notes?.user_email || payment.email

      console.log('💳 Payment Details:')
      console.log('   ID:', payment.id)
      console.log('   Amount: ₹' + payment.amount / 100)
      console.log('   User ID:', userId || 'Not provided')
      console.log('   Plan:', planName || 'Not provided')
      console.log('   Email:', userEmail || 'Not provided')

      // If no user_id, try to find by email
      let finalUserId = userId
      if (!finalUserId && payment.email) {
        console.log('🔍 Searching user by email:', payment.email)
        finalUserId = await findUserByEmail(supabaseUrl, supabaseKey, payment.email)
      }

      if (!finalUserId) {
        console.log('⚠️ User not found, logging payment for manual processing')
        
        await logPayment(supabaseUrl, supabaseKey, {
          razorpay_payment_id: payment.id,
          razorpay_order_id: payment.order_id,
          amount: payment.amount / 100,
          plan_name: planName || 'unknown',
          payer_email: payment.email,
          payer_phone: payment.contact,
          status: 'user_not_found',
          raw_payload: payment
        })

        return NextResponse.json({
          success: false,
          message: 'User not found. Payment logged for manual processing.',
          paymentId: payment.id
        })
      }

      // Get plan configuration
      const plan = PLANS[planName?.toLowerCase()] || PLANS['new_member']
      console.log('📦 Plan config:', plan)

      // Calculate expiry
      const validUntil = new Date()
      validUntil.setDate(validUntil.getDate() + plan.duration_days)

      // Update user's plan
      const updateSuccess = await updateUserPlan(supabaseUrl, supabaseKey, finalUserId, {
        plan_name: planName,
        daily_limit: plan.daily_limit,
        payment_status: 'active',
        valid_until: validUntil.toISOString(),
        leads_today: 0
      })

      // Log payment
      await logPayment(supabaseUrl, supabaseKey, {
        user_id: finalUserId,
        razorpay_payment_id: payment.id,
        razorpay_order_id: payment.order_id,
        amount: payment.amount / 100,
        currency: payment.currency,
        plan_name: planName,
        payer_email: payment.email,
        payer_phone: payment.contact,
        status: updateSuccess ? 'captured' : 'activation_failed',
        raw_payload: payment
      })

      if (updateSuccess) {
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
        console.log('🎉 PLAN ACTIVATED!')
        console.log('   User:', userEmail)
        console.log('   Plan:', planName)
        console.log('   Daily Limit:', plan.daily_limit)
        console.log('   Valid Until:', validUntil.toISOString())
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')

        return NextResponse.json({
          success: true,
          message: 'Plan activated successfully',
          plan: planName,
          validUntil: validUntil.toISOString()
        })
      } else {
        console.error('❌ Plan activation failed')
        return NextResponse.json({
          success: false,
          message: 'Plan activation failed'
        })
      }
    }

    // Handle payment.failed
    if (payload.event === 'payment.failed') {
      const payment = payload.payload?.payment?.entity
      console.log('❌ Payment failed:', payment?.id)

      if (payment) {
        await logPayment(supabaseUrl, supabaseKey, {
          user_id: payment.notes?.user_id,
          razorpay_payment_id: payment.id,
          amount: payment.amount / 100,
          plan_name: payment.notes?.plan_name,
          payer_email: payment.email,
          payer_phone: payment.contact,
          status: 'failed',
          raw_payload: payment
        })
      }

      return NextResponse.json({ received: true, status: 'failed' })
    }

    // Other events
    console.log('ℹ️ Unhandled event:', payload.event)
    return NextResponse.json({ received: true, event: payload.event })

  } catch (error: any) {
    console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.error('❌ WEBHOOK ERROR:', error.message)
    console.error('Stack:', error.stack)
    console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}

// Helper: Find user by email
async function findUserByEmail(
  supabaseUrl: string,
  supabaseKey: string,
  email: string
): Promise<string | null> {
  try {
    const response = await fetch(
      `${supabaseUrl}/rest/v1/users?email=ilike.${encodeURIComponent(email)}&select=id`,
      {
        method: 'GET',
        headers: {
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`,
          'Content-Type': 'application/json'
        }
      }
    )

    if (response.ok) {
      const users = await response.json()
      if (users && users.length > 0) {
        console.log('✅ Found user by email:', users[0].id)
        return users[0].id
      }
    }
    return null
  } catch (error) {
    console.error('❌ Find user error:', error)
    return null
  }
}

// Helper: Update user plan
async function updateUserPlan(
  supabaseUrl: string,
  supabaseKey: string,
  userId: string,
  data: any
): Promise<boolean> {
  try {
    console.log('🔄 Updating user:', userId)
    
    const response = await fetch(
      `${supabaseUrl}/rest/v1/users?id=eq.${userId}`,
      {
        method: 'PATCH',
        headers: {
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=minimal'
        },
        body: JSON.stringify({
          ...data,
          updated_at: new Date().toISOString()
        })
      }
    )

    if (!response.ok) {
      const errorText = await response.text()
      console.error('❌ Update failed:', response.status, errorText)
      return false
    }

    console.log('✅ User updated successfully')
    return true
  } catch (error: any) {
    console.error('❌ Update error:', error.message)
    return false
  }
}

// Helper: Log payment
async function logPayment(
  supabaseUrl: string,
  supabaseKey: string,
  data: any
): Promise<boolean> {
  try {
    const response = await fetch(
      `${supabaseUrl}/rest/v1/payments`,
      {
        method: 'POST',
        headers: {
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=minimal'
        },
        body: JSON.stringify({
          ...data,
          created_at: new Date().toISOString()
        })
      }
    )

    if (!response.ok) {
      const errorText = await response.text()
      console.error('❌ Log payment failed:', response.status, errorText)
      return false
    }

    console.log('✅ Payment logged')
    return true
  } catch (error: any) {
    console.error('❌ Log payment error:', error.message)
    return false
  }
}
