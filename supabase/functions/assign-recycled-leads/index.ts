import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

serve(async (req) => {
  const startTime = Date.now()
  const batchLabel = req.headers.get('x-batch') || 'manual'

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  )

  // CHECK 1: Working hours only (8 AM - 10 PM IST)
  const istTime = new Date(new Date().toLocaleString('en-US', {
    timeZone: 'Asia/Kolkata'
  }))
  const hourIST = istTime.getHours()

  if (hourIST < 8 || hourIST >= 22) {
    console.log(`[Recycler] Outside working hours (8AM-10PM IST), current hour: ${hourIST}`)
    return new Response(JSON.stringify({
      success: false,
      message: 'Recycling only during working hours (8AM-10PM IST)',
      hour: hourIST
    }), { headers: { 'Content-Type': 'application/json' } })
  }

  console.log(`[Recycler] Starting ${batchLabel} batch... (IST hour: ${hourIST})`)

  try {
    // Note: Fresh leads check removed - recycling independent
    console.log('[Recycler] Proceeding with recycling assignment')

    const { data: users, error: usersError } = await supabase
      .from('users')
      .select(`
        id, email, plan_name, team_code,
        recycled_leads_quota, recycled_leads_received,
        leads_today, daily_limit, daily_limit_override,
        total_leads_received, total_leads_promised
      `)
      .eq('is_active', true)
      .eq('is_online', true)
      .eq('payment_status', 'active')
      .eq('is_new_system', true)
      .not('plan_name', 'eq', 'none')
      .not('plan_name', 'is', null)

    if (usersError) throw new Error('Users fetch: ' + usersError.message)

    console.log(`[Recycler] ${users?.length || 0} active users`)

    // Get plan config
    const { data: configRow } = await supabase
      .from('system_config')
      .select('config_value')
      .eq('config_key', 'plan_fresh_config')
      .single()

    const planConfigs = configRow?.config_value || {}

    const results = []
    let totalAssigned = 0

    for (const user of (users || [])) {
      try {
        const config = planConfigs[user.plan_name]
        if (!config) continue

        const recycledRemaining =
          (user.recycled_leads_quota || 0) -
          (user.recycled_leads_received || 0)

        if (recycledRemaining <= 0) continue

        const totalRemaining =
          (user.total_leads_promised || 0) -
          (user.total_leads_received || 0)

        if (totalRemaining <= 0) continue

        // Smart daily limit logic for recycled leads
        const dailyLimit = user.daily_limit_override || user.daily_limit || 0
        const leadsToday = user.leads_today || 0
        const dailyRemaining = dailyLimit - leadsToday

        // Abuse prevention: skip if user already got 150% of daily limit
        if (dailyLimit > 0 && leadsToday >= dailyLimit * 1.5) {
          console.log(`[Recycler] ${user.email} exceeded 150% daily limit (${leadsToday}/${dailyLimit}) - skipping`)
          continue
        }

        // Half of daily recycled per batch
        const batchTarget = Math.ceil((config.recycled_daily || 0) / 2)

        let canAssign: number

        if (dailyRemaining > 0) {
          // User hasn't hit daily limit yet — respect it
          canAssign = Math.min(
            batchTarget,
            recycledRemaining,
            totalRemaining,
            dailyRemaining
          )
        } else {
          // User already hit daily limit — allow max 5 bonus recycled/day
          const bonusAllowed = Math.min(5, batchTarget)
          canAssign = Math.min(bonusAllowed, recycledRemaining, totalRemaining)
          if (canAssign > 0) {
            console.log(`[Recycler] ${user.email} bonus recycled: up to ${canAssign} (daily limit reached)`)
          }
        }

        if (canAssign <= 0) continue

        const { data: assigned, error: rpcError } = await supabase
          .rpc('assign_recycled_leads', {
            p_user_id: user.id,
            p_count: canAssign
          })

        if (rpcError) {
          console.error(`[Recycler] ${user.email}:`, rpcError.message)
          continue
        }

        const count = assigned || 0

        if (count > 0) {
          totalAssigned += count
          results.push({ user: user.email, plan: user.plan_name, assigned: count })

          // Push notification — use explicit fetch with Authorization header
          // (supabase.functions.invoke() does not reliably pass auth in server-side Deno context)
          try {
            const supabaseUrl = Deno.env.get('SUPABASE_URL')!
            const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
            await fetch(`${supabaseUrl}/functions/v1/send-push-notification`, {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${supabaseKey}`,
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                user_id: user.id,
                title: '🔔 Naya Lead Aaya!',
                body: `${count} naye lead${count > 1 ? 's' : ''} assign hue hain!`,
                url: '/dashboard'
              })
            })
          } catch (_) { /* non-critical */ }
        }

      } catch (err) {
        console.error(`[Recycler] Error for ${user.email}:`, err)
      }
    }

    const response = {
      success: true,
      batch: batchLabel,
      users_processed: users?.length || 0,
      leads_assigned: totalAssigned,
      duration_ms: Date.now() - startTime,
      details: results
    }

    console.log('[Recycler] Done:', JSON.stringify(response))
    return new Response(JSON.stringify(response), {
      headers: { 'Content-Type': 'application/json' }
    })

  } catch (err) {
    console.error('[Recycler] FATAL:', err)
    return new Response(
      JSON.stringify({ success: false, error: String(err) }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
})
