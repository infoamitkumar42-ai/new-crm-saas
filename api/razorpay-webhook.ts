import { NextRequest, NextResponse } from 'next/server'

// Plan Configuration
const PLANS: Record<string, { daily_limit: number; duration_days: number }> = {
  'new_member': { daily_limit: 2, duration_days: 30 },
  'supervisor': { daily_limit: 4, duration_days: 30 },
  'manager': { daily_limit: 7, duration_days: 30 },
  'boost_a': { daily_limit: 10, duration_days: 7 },
  'boost_b': { daily_limit: 17, duration_days: 7 },
  'boost_c': { daily_limit: 26, duration_days: 7 },
  'starter': { daily_limit: 10, duration_days: 30 },
  'fast_start': { daily_limit: 5, duration_days: 7 },
  'turbo_weekly': { daily_limit: 20, duration_days: 7 },
  'max_blast': { daily_limit: 35, duration_days: 7 },
}

// GET - Health Check
export async function GET() {
  try {
    const supabaseUrl = process.env.VITE_SUPABASE_URL || ''
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET || ''

    return NextResponse.json({
      status: 'active',
      message: 'Razorpay webhook is running',
      timestamp: new Date().toISOString(),
      env: {
        supabase_url: supabaseUrl ? 'SET' : 'MISSING',
        service_key: serviceKey ? 'SET' : 'MISSING',
        webhook_secret: webhookSecret ? 'SET' : 'MISSING'
      },
      plans: Object.keys(PLANS)
    })
  } catch (error: any) {
    return NextResponse.json({
      status: 'error',
      message: error.message
    }, { status: 500 })
  }
}

// POST - Handle Razorpay Webhook
export async function POST(req: NextRequest) {
  console.log('========================================')
  console.log('📦 RAZORPAY WEBHOOK RECEIVED')
  console.log('Time:', new Date().toISOString())
  console.log('========================================')

  try {
    // Get environment variables
    const supabaseUrl = process.env.VITE_SUPABASE_URL
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    // Log environment check
    console.log('🔑 Environment Check:')
    console.log('   VITE_SUPABASE_URL:', supabaseUrl ? '✅ SET' : '❌ MISSING')
    console.log('   SUPABASE_SERVICE_ROLE_KEY:', supabaseKey ? '✅ SET' : '❌ MISSING')

    if (!supabaseUrl) {
      console.error('❌ VITE_SUPABASE_URL is missing!')
      return NextResponse.json({ error: 'Missing VITE_SUPABASE_URL' }, { status: 500 })
    }

    if (!supabaseKey) {
      console.error('❌ SUPABASE_SERVICE_ROLE_KEY is missing!')
      return NextResponse.json({ error: 'Missing SUPABASE_SERVICE_ROLE_KEY' }, { status: 500 })
    }

    // Parse request body
    let body: string
    let payload: any

    try {
      body = await req.text()
      console.log('📄 Raw body length:', body.length)
    } catch (e) {
      console.error('❌ Failed to read request body')
      return NextResponse.json({ error: 'Failed to read body' }, { status: 400 })
    }

    try {
      payload = JSON.parse(body)
      console.log('📋 Event:', payload.event)
    } catch (e) {
      console.error('❌ Invalid JSON in body')
      return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
    }

    // Handle payment.captured event
    if (payload.event === 'payment.captured') {
      console.log('💳 Processing payment.captured...')

      const payment = payload.payload?.payment?.entity
      if (!payment) {
        console.error('❌ No payment entity in payload')
        return NextResponse.json({ error: 'No payment data' }, { status: 400 })
      }

      // Extract info from notes
      const userId = payment.notes?.user_id || null
      const planName = payment.notes?.plan_name || payment.notes?.plan || 'new_member'
      const payerEmail = payment.email || payment.notes?.user_email || ''
      const payerPhone = payment.contact || ''
      const amount = payment.amount ? payment.amount / 100 : 0

      console.log('📊 Payment Details:')
      console.log('   Payment ID:', payment.id)
      console.log('   Amount: ₹' + amount)
      console.log('   User ID:', userId || 'NOT PROVIDED')
      console.log('   Plan:', planName)
      console.log('   Email:', payerEmail)
      console.log('   Phone:', payerPhone)

      // Find user if user_id not provided
      let finalUserId = userId
      if (!finalUserId && payerEmail) {
        console.log('🔍 Searching user by email...')
        finalUserId = await findUserByEmail(supabaseUrl, supabaseKey, payerEmail)
      }

      // Log payment to database
      console.log('💾 Logging payment...')
      await logPaymentToDb(supabaseUrl, supabaseKey, {
        user_id: finalUserId,
        razorpay_payment_id: payment.id,
        razorpay_order_id: payment.order_id || null,
        amount: amount,
        plan_name: planName,
        payer_email: payerEmail,
        payer_phone: payerPhone,
        status: finalUserId ? 'captured' : 'user_not_found',
        raw_payload: payment
      })

      // Activate plan if user found
      if (finalUserId) {
        console.log('🔄 Activating plan for user:', finalUserId)
        
        const plan = PLANS[planName.toLowerCase()] || PLANS['new_member']
        const validUntil = new Date()
        validUntil.setDate(validUntil.getDate() + plan.duration_days)

        const success = await updateUserPlan(supabaseUrl, supabaseKey, finalUserId, {
          plan_name: planName,
          daily_limit: plan.daily_limit,
          payment_status: 'active',
          valid_until: validUntil.toISOString(),
          leads_today: 0
        })

        if (success) {
          console.log('========================================')
          console.log('🎉 PLAN ACTIVATED SUCCESSFULLY!')
          console.log('   Plan:', planName)
          console.log('   Daily Limit:', plan.daily_limit)
          console.log('   Valid Until:', validUntil.toISOString())
          console.log('========================================')

          return NextResponse.json({
            success: true,
            message: 'Plan activated',
            plan: planName
          })
        } else {
          console.error('❌ Failed to update user plan')
          return NextResponse.json({
            success: false,
            message: 'Failed to activate plan'
          })
        }
      } else {
        console.log('⚠️ User not found, payment logged for manual processing')
        return NextResponse.json({
          success: false,
          message: 'User not found, payment logged'
        })
      }
    }

    // Handle payment.failed event
    if (payload.event === 'payment.failed') {
      console.log('❌ Payment failed event received')
      const payment = payload.payload?.payment?.entity

      if (payment) {
        await logPaymentToDb(supabaseUrl, supabaseKey, {
          user_id: payment.notes?.user_id || null,
          razorpay_payment_id: payment.id,
          amount: payment.amount ? payment.amount / 100 : 0,
          plan_name: payment.notes?.plan_name || 'unknown',
          payer_email: payment.email || '',
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
    console.error('========================================')
    console.error('❌ WEBHOOK ERROR!')
    console.error('Message:', error.message)
    console.error('Stack:', error.stack)
    console.error('========================================')

    return NextResponse.json(
      { error: error.message || 'Internal server error' },
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
    const url = `${supabaseUrl}/rest/v1/users?email=ilike.${encodeURIComponent(email)}&select=id&limit=1`
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`,
        'Content-Type': 'application/json'
      }
    })

    if (response.ok) {
      const users = await response.json()
      if (users && users.length > 0) {
        console.log('✅ User found:', users[0].id)
        return users[0].id
      }
    }

    console.log('⚠️ User not found for email:', email)
    return null
  } catch (error: any) {
    console.error('❌ Find user error:', error.message)
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
    const url = `${supabaseUrl}/rest/v1/users?id=eq.${userId}`

    const response = await fetch(url, {
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
    })

    if (response.ok) {
      console.log('✅ User plan updated')
      return true
    } else {
      const errorText = await response.text()
      console.error('❌ Update failed:', response.status, errorText)
      return false
    }
  } catch (error: any) {
    console.error('❌ Update error:', error.message)
    return false
  }
}

// Helper: Log payment to database
async function logPaymentToDb(
  supabaseUrl: string,
  supabaseKey: string,
  data: any
): Promise<boolean> {
  try {
    const url = `${supabaseUrl}/rest/v1/payments`

    const response = await fetch(url, {
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
    })

    if (response.ok) {
      console.log('✅ Payment logged to database')
      return true
    } else {
      const errorText = await response.text()
      console.error('❌ Log payment failed:', response.status, errorText)
      return false
    }
  } catch (error: any) {
    console.error('❌ Log payment error:', error.message)
    return false
  }
}
