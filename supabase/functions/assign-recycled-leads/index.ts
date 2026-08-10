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

// ── AUGUST OFFER MODE ────────────────────────────────────────────────────
// true hone par:
//   1. Boost plans ka day-3/5/7 gate bypass hota hai (offer quota us schedule
//      se poori nahi ho sakti — weekly_boost ko 97 recycled chahiye, schedule
//      sirf 12 deta tha).
//   2. recycled_daily poore din ke RUNS_PER_DAY runs mein baraabar-baraabar
//      baatta hai (neeche dekho) — ek hi 3:30 PM batch mein sab dump karne se
//      user ko "achanak itni saari purani leads kahan se aayi" jaisa lagta
//      tha. Ab din bhar mein chhoti-chhoti kist mein aati hain, fresh ke saath
//      mix hoke — behtar lagta hai, koi margin/cost farak nahi (recycled lead
//      hamesha ₹0 cost ki hoti hai, chahe kabhi bhi di jaye).
// Offer band karte waqt isse false kar do. Runbook: OFFER-PLAYBOOK.md
const OFFER_MODE = true

// Din bhar mein cron kitni baar chalta hai (cron.job 22 ka schedule isी se
// match karna chahiye — abhi 11AM-9PM IST, har 2 ghante, 6 runs).
const RUNS_PER_DAY = 6

// ── ADMIN-CONTROLLED RECYCLE POOL (2026-08-10) ───────────────────────────
// Ab ye function `system_config.recycled_pool_control` padhta hai, jise admin
// dashboard se on/off kiya ja sakta hai. Row ka shape:
//   { enabled: bool, max_per_user_per_day: number, allowed_team_codes: string[] }
//
// Teen naye rules:
//   1. MASTER SWITCH  — enabled=false hone par kuch bhi assign nahi hoga.
//   2. TEAM ALLOWLIST — sirf allowed_team_codes waale users ko recycled
//      milengi. Admin ka rule: sirf TEAMFIRE. ECO@WIN12 aur Simar ke managed
//      users ko recycled bilkul nahi jaani chahiye (dono filter lagte hain —
//      team allowlist AND manager exclusion — taaki kisi ka team_code badal
//      bhi jaye to Simar ke users phir bhi bache rahein).
//   3. PER-DAY CAP    — max_per_user_per_day ek user ko POORE DIN mein milne
//      waali recycled leads ki limit hai, per-batch nahi. Pehle sirf per-batch
//      target tha, isliye 6 runs × N ho jaata tha (e.g. turbo_boost ko
//      4/batch = 24/day). Ab aaj ki already-assign ho chuki recycled leads
//      count karke cap lagti hai, to "2-4 per day" ka matlab sach mein
//      2-4 per day hi hai.
//
// FAIL-SAFE: config row missing ho, JSON galat ho, allowed_team_codes khaali
// ho, ya read fail ho jaye — har case mein function OFF maanta hai (0 leads).
// Recycled na jaana galat jaana se behtar hai. Fresh lead distribution is
// function se bilkul alag hai (meta-webhook / sheet-lead-intake /
// process-backlog / get_best_assignee_for_team), wo har haal mein normally
// chalti rahegi — ye switch use kabhi touch nahi karta.
const SIMAR_MANAGER_ID = 'acaf3c4d-22bf-43eb-b91d-eae0d6af9f76' // simar@forever.com

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
  const startOfDayIso = new Date(`${todayIST}T00:00:00+05:30`).toISOString()

  console.log(`[Recycler] Starting ${batchLabel} batch... (IST hour: ${hourIST}, date: ${todayIST})`)

  // ── CHECK 2: Admin master switch + pool settings ────────────────────────
  // Fail-safe by design: koi bhi gadbad (row missing, read error, galat type,
  // khaali team list) = OFF. Isliye har value ko explicitly validate kiya hai
  // bajaye `||` default dene ke.
  let poolEnabled = false
  let maxPerUserPerDay = 0
  let allowedTeams: string[] = []

  try {
    const { data: poolRow, error: poolErr } = await supabase
      .from('system_config')
      .select('config_value')
      .eq('config_key', 'recycled_pool_control')
      .maybeSingle()

    if (poolErr) throw new Error(poolErr.message)

    const cfg = poolRow?.config_value as Record<string, unknown> | null | undefined

    poolEnabled = cfg?.enabled === true

    const rawMax = Number(cfg?.max_per_user_per_day)
    maxPerUserPerDay = Number.isFinite(rawMax) && rawMax > 0 ? Math.floor(rawMax) : 0

    allowedTeams = Array.isArray(cfg?.allowed_team_codes)
      ? (cfg!.allowed_team_codes as unknown[])
          .filter((t): t is string => typeof t === 'string' && t.trim().length > 0)
          .map((t) => t.trim())
      : []
  } catch (cfgErr) {
    console.error('[Recycler] Config read failed — treating pool as OFF:', cfgErr)
    poolEnabled = false
  }

  if (!poolEnabled || maxPerUserPerDay <= 0 || allowedTeams.length === 0) {
    const reason = !poolEnabled
      ? 'recycled_pool_control.enabled = false (admin switch OFF)'
      : maxPerUserPerDay <= 0
        ? 'max_per_user_per_day is not a positive number'
        : 'allowed_team_codes is empty'

    console.log(`[Recycler] Pool disabled — ${reason}. Assigning 0 leads.`)
    return new Response(JSON.stringify({
      success: true,
      pool_enabled: false,
      reason,
      leads_assigned: 0,
      batch: batchLabel,
      duration_ms: Date.now() - startTime
    }), { headers: { 'Content-Type': 'application/json' } })
  }

  console.log(`[Recycler] Pool ON — max ${maxPerUserPerDay}/user/day, teams: ${allowedTeams.join(', ')}`)

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
      // Team allowlist (admin-configured — currently TEAMFIRE only).
      // Verified 2026-08-10: no user's team_code contains a comma, so a
      // straight .in() match is correct here (multi-team comma strings only
      // ever exist on sheet_intake_tokens, never on users).
      .in('team_code', allowedTeams)
      // Belt-and-braces: Simar ke managed users ko recycled kabhi nahi.
      // Abhi wo sab ECO@WIN12 hain (isliye team filter already unhe hata deta
      // hai), par agar kisi ka team_code kabhi TEAMFIRE ho gaya to ye guard
      // phir bhi bachata hai.
      .or(`manager_id.is.null,manager_id.neq.${SIMAR_MANAGER_ID}`)

    if (usersError) throw new Error('Users fetch: ' + usersError.message)

    console.log(`[Recycler] ${users?.length || 0} eligible users (teams: ${allowedTeams.join(', ')}, Simar excluded)`)

    // ── Aaj ab tak kisko kitni recycled leads mil chuki hain ──────────────
    // Ek hi query mein sabka count le lete hain (per-user query se behtar).
    // Isi se per-DAY cap lagta hai — per-batch nahi.
    const recycledTodayByUser = new Map<string, number>()
    {
      const { data: todayRecycled, error: trErr } = await supabase
        .from('leads')
        .select('assigned_to')
        .eq('lead_type', 'recycled')
        .gte('assigned_at', startOfDayIso)
        .not('assigned_to', 'is', null)
        .limit(10000)

      if (trErr) {
        // Count na mile to cap lagana safe nahi — is run ko skip kar do
        // (agli run 2 ghante baad hai, koi lead permanently nahi rukti).
        throw new Error('Today-recycled count fetch: ' + trErr.message)
      }

      for (const row of (todayRecycled || [])) {
        const uid = (row as { assigned_to: string }).assigned_to
        recycledTodayByUser.set(uid, (recycledTodayByUser.get(uid) || 0) + 1)
      }
    }

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

        // ── PER-DAY CAP (admin-controlled) ──────────────────────────────
        // Aaj is user ko jitni recycled mil chuki hain, usse aage kitni aur
        // de sakte hain. Dono branches (boost + old plans) isi cap se guzarte
        // hain, isliye OFFER_MODE kabhi false bhi ho jaye to cap lagta rahega.
        const gotRecycledToday = recycledTodayByUser.get(user.id) || 0
        const dayCapRemaining = maxPerUserPerDay - gotRecycledToday

        if (dayCapRemaining <= 0) {
          console.log(`[Recycler] ${user.email}: daily recycled cap reached (${gotRecycledToday}/${maxPerUserPerDay})`)
          continue
        }

        // ── BOOST PLANS: Day 3/5/7 gate (OFFER_MODE mein bypass) ────────
        if (!OFFER_MODE && BOOST_PLANS.has(user.plan_name)) {

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

          const canAssign = Math.min(recycledDayAmount, recycledRemaining, totalRemaining, dayCapRemaining)
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

        const batchTarget = OFFER_MODE
          ? Math.max(1, Math.ceil((config.recycled_daily || 0) / RUNS_PER_DAY))
          : Math.ceil((config.recycled_daily || 0) / 2)

        let canAssign: number
        if (dailyRemaining > 0) {
          canAssign = Math.min(batchTarget, recycledRemaining, totalRemaining, dailyRemaining, dayCapRemaining)
        } else {
          // "Bonus" path: user apni daily_limit poori kar chuka hai par 150%
          // se neeche hai. Ye pehle se maujood behaviour hai — chhoda gaya
          // hai, par ab ye bhi per-day cap ke andar hi rahega.
          const bonusAllowed = Math.min(5, batchTarget)
          canAssign = Math.min(bonusAllowed, recycledRemaining, totalRemaining, dayCapRemaining)
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
      pool_enabled: true,
      max_per_user_per_day: maxPerUserPerDay,
      allowed_team_codes: allowedTeams,
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
