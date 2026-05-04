import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// Recycled delivery schedule for boost plans — Day 3, 5, 7 only
// Old plans (starter/supervisor/manager) use existing ratio-based logic
const RECYCLED_SCHEDULE: Record<string, { recycledDayAmount: number }> = {
  daily_boost:  { recycledDayAmount: 2 },
  weekly_boost: { recycledDayAmount: 4 },
  turbo_boost:  { recycledDayAmount: 5 },
}

const BOOST_PLANS = new Set(['daily_boost', 'weekly_boost', 'turbo_boost'])

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

  // Today's date in IST (YYYY-MM-DD)
  const todayIST = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' })

  console.log(`[Recycler] Starting ${batchLabel} batch... (IST hour: ${hourIST}, date: ${todayIST})`)

  try {
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select(`
        id, email, plan_name, team_code,
        recycled_leads_quota, recycled_leads_received,
        leads_today, daily_limit, daily_limit_override,
        total_leads_received, total_leads_promised,
        plan_start_date
      `)
      .eq('is_active', true)
      .eq('is_online', true)
      .eq('payment_status', 'active')
      .eq('is_new_system', true)
      .not('plan_name', 'eq', 'none')
      .not('plan_name', 'is', null)

    if (usersError) throw new Error('Users fetch: ' + usersError.message)

    console.log(`[Recycler] ${users?.length || 0} active users`)

    const { data: configRow } = await supabase
      .from('system_config')
      .select('config_value')
      .eq('config_key', 'plan_fresh_config')
      .single()

    const planConfigs = configRow?.config_value || {}

    const results = []
    const skipped = []
    let totalAssigned = 0

    for (const user of (users || [])) {
      try {
        const config = planConfigs[user.plan_name]
        if (!config) continue

        // ── BOOST PLANS: Day 3/5/7 gate ─────────────────────────────────
        if (BOOST_PLANS.has(user.plan_name)) {

          if (!user.plan_start_date) {
            console.log(`[Recycler] ${user.email}: no plan_start_date, skipping`)
            continue
          }

          const daysSinceStart = Math.floor(
            (new Date(todayIST).getTime() - new Date(user.plan_start_date).getTime())
            / (1000 * 60 * 60 * 24)
          )
          const dayNumber = (daysSinceStart % 7) + 1
          const isRecycledDay = [3, 5, 7].includes(dayNumber)

          console.log(`[Recycler] ${user.email} (${user.plan_name}): day ${dayNumber}, recycledDay=${isRecycledDay}`)

          if (!isRecycledDay) {
            skipped.push({ user: user.email, reason: `day ${dayNumber} not recycled day` })
            continue
          }

          const recycledDayAmount = RECYCLED_SCHEDULE[user.plan_name].recycledDayAmount

          const recycledRemaining = (user.recycled_leads_quota || 0) - (user.recycled_leads_received || 0)
          if (recycledRemaining <= 0) continue

          const totalRemaining = (user.total_leads_promised || 0) - (user.total_leads_received || 0)
          if (totalRemaining <= 0) continue

          const canAssign = Math.min(recycledDayAmount, recycledRemaining, totalRemaining)
          if (canAssign <= 0) continue

          const { data: assigned, error: rpcError } = await supabase
            .rpc('assign_recycled_leads', { p_user_id: user.id, p_count: canAssign })

          if (rpcError) {
            console.error(`[Recycler] ${user.email}:`, rpcError.message)
            continue
          }

          const count = assigned || 0
          if (count > 0) {
            totalAssigned += count
            results.push({ user: user.email, plan: user.plan_name, day: dayNumber, assigned: count })

            try {
              const supabaseUrl = Deno.env.get('SUPABASE_URL')!
              const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
              await fetch(`${supabaseUrl}/functions/v1/send-push-notification`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${supabaseKey}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  user_id: user.id,
                  title: '🔔 Naya Lead Aaya!',
                  body: `${count} naye lead${count > 1 ? 's' : ''} assign hue hain!`,
                  url: '/dashboard'
                })
              })
            } catch (_) { /* non-critical */ }
          }

          continue
        }

        // ── OLD PLANS (starter/supervisor/manager): existing logic unchanged ──
        const recycledRemaining =
          (user.recycled_leads_quota || 0) -
          (user.recycled_leads_received || 0)

        if (recycledRemaining <= 0) continue

        const totalRemaining =
          (user.total_leads_promised || 0) -
          (user.total_leads_received || 0)

        if (totalRemaining <= 0) continue

        const dailyLimit = user.daily_limit_override || user.daily_limit || 0
        const leadsToday = user.leads_today || 0
        const dailyRemaining = dailyLimit - leadsToday

        if (dailyLimit > 0 && leadsToday >= dailyLimit * 1.5) {
          console.log(`[Recycler] ${user.email} exceeded 150% daily limit (${leadsToday}/${dailyLimit}) - skipping`)
          continue
        }

        const batchTarget = Math.ceil((config.recycled_daily || 0) / 2)

        let canAssign: number
        if (dailyRemaining > 0) {
          canAssign = Math.min(batchTarget, recycledRemaining, totalRemaining, dailyRemaining)
        } else {
          const bonusAllowed = Math.min(5, batchTarget)
          canAssign = Math.min(bonusAllowed, recycledRemaining, totalRemaining)
          if (canAssign > 0) {
            console.log(`[Recycler] ${user.email} bonus recycled: up to ${canAssign} (daily limit reached)`)
          }
        }

        if (canAssign <= 0) continue

        const { data: assigned, error: rpcError } = await supabase
          .rpc('assign_recycled_leads', { p_user_id: user.id, p_count: canAssign })

        if (rpcError) {
          console.error(`[Recycler] ${user.email}:`, rpcError.message)
          continue
        }

        const count = assigned || 0
        if (count > 0) {
          totalAssigned += count
          results.push({ user: user.email, plan: user.plan_name, assigned: count })

          try {
            const supabaseUrl = Deno.env.get('SUPABASE_URL')!
            const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
            await fetch(`${supabaseUrl}/functions/v1/send-push-notification`, {
              method: 'POST',
              headers: { 'Authorization': `Bearer ${supabaseKey}`, 'Content-Type': 'application/json' },
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
      skipped_non_recycled_day: skipped.length,
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
