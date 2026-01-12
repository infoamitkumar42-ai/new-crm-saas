# 📊 LEAD GENERATION CALCULATION - 10 PM TARGET

**Current Time:** 2:42 PM (14:42 IST)  
**Target Time:** 10:00 PM (22:00 IST)  
**Time Remaining:** ~7 hours 18 minutes (438 minutes)

---

## 🎯 CALCULATION METHOD

### Step 1: Run the Main Calculation Query
```sql
-- Copy this query and run it in your database (Supabase SQL Editor or similar)

SELECT 
    COUNT(*) AS "Total Active Users",
    SUM(daily_limit) AS "Total Daily Capacity",
    SUM(COALESCE(leads_today, 0)) AS "Leads Sent So Far",
    SUM(GREATEST(0, daily_limit - COALESCE(leads_today, 0))) AS "🔥 TOTAL LEADS NEEDED BY 10PM",
    ROUND(
        SUM(COALESCE(leads_today, 0))::numeric / 
        NULLIF(SUM(daily_limit), 0) * 100, 
        1
    ) AS "Overall Progress %",
    ROUND(
        SUM(GREATEST(0, daily_limit - COALESCE(leads_today, 0)))::numeric / 7.3,
        0
    ) AS "⚡ Leads Per Hour Needed"
FROM users
WHERE role = 'member' 
AND payment_status = 'active';
```

---

## 📋 PLAN-WISE BREAKDOWN

### Standard Daily Limits (Based on your system):
- **Starter:** 5-10 leads/day
- **Supervisor:** 15-20 leads/day  
- **Manager:** 25-30 leads/day
- **Weekly Boost:** 20-25 leads/day
- **Turbo Boost:** 30-40 leads/day

### Plan-wise Need Calculation:
```sql
SELECT 
    plan_name AS "Plan",
    COUNT(*) AS "Active Users",
    SUM(daily_limit) AS "Total Daily Quota",
    SUM(COALESCE(leads_today, 0)) AS "Already Sent Today",
    SUM(GREATEST(0, daily_limit - COALESCE(leads_today, 0))) AS "🎯 LEADS NEEDED BY 10PM",
    ROUND(
        SUM(COALESCE(leads_today, 0))::numeric / 
        NULLIF(SUM(daily_limit), 0) * 100, 
        1
    ) AS "% Complete"
FROM users
WHERE role = 'member' 
AND payment_status = 'active'
GROUP BY plan_name
ORDER BY SUM(GREATEST(0, daily_limit - COALESCE(leads_today, 0))) DESC;
```

---

## ⏱️ HOURLY GENERATION PACE

If you need **X total leads** by 10 PM:

| Timeline | Calculation | Formula |
|----------|-------------|---------|
| **Per Hour** | X ÷ 7.3 hours | Total / 7.3 |
| **Per 30 Minutes** | X ÷ 14.6 | Total / 14.6 |
| **Per 15 Minutes** | X ÷ 29.2 | Total / 29.2 |
| **Per Minute** | X ÷ 438 | Total / 438 |

---

## 🚀 PRIORITY DISTRIBUTION ORDER

**Distribute leads in this priority order:**

1. **🚀 BOOSTER USERS** (turbo_boost, weekly_boost)
   - Highest priority
   - These are paying premium

2. **👔 MANAGER USERS**
   - Second priority
   - Higher tier plan

3. **👨‍💼 SUPERVISOR USERS**
   - Third priority
   - Mid-tier plan

4. **🌱 STARTER USERS**
   - Last priority
   - Entry-level plan

---

## 📊 EXAMPLE CALCULATION

**Assume you get these results from the first query:**

| Metric | Value |
|--------|-------|
| Total Active Users | 50 users |
| Total Daily Capacity | 1000 leads |
| Already Sent | 350 leads |
| **NEEDED BY 10 PM** | **650 leads** |
| Progress % | 35% |
| **Leads/Hour Needed** | **89 leads/hour** |

### Breakdown:
- **650 total leads needed**
- **7.3 hours remaining**
- **89 leads per hour** = 650 ÷ 7.3
- **45 leads per 30 min** = 89 ÷ 2
- **22 leads per 15 min** = 89 ÷ 4
- **1.5 leads per minute** = 89 ÷ 60

---

## 🔍 HOW TO GET YOUR EXACT NUMBER

### Option 1: Supabase Dashboard
1. Go to your Supabase project
2. Click on "SQL Editor"
3. Paste the calculation query from above
4. Hit "Run"
5. You'll see the exact number needed

### Option 2: Use the Full SQL File
1. Open `Calculate_Leads_Needed_By_10PM.sql` 
2. Copy all queries
3. Run in Supabase SQL Editor
4. You'll get 5 different reports:
   - Individual user breakdown
   - Plan-wise summary
   - Grand total
   - Hourly breakdown
   - Priority breakdown

---

## ✅ QUICK ACTION CHECKLIST

- [ ] Run the calculation query to get exact number
- [ ] Note down "TOTAL LEADS NEEDED BY 10PM"
- [ ] Calculate hourly pace needed
- [ ] Set up lead generation/import to match the pace
- [ ] Prioritize Booster → Manager → Supervisor → Starter
- [ ] Monitor progress every hour
- [ ] Verify distribution is equal according to plan limits

---

## 🎯 FORMULA SUMMARY

```
TOTAL_LEADS_NEEDED = Σ(daily_limit - leads_today) for all active users

HOURLY_PACE = TOTAL_LEADS_NEEDED ÷ 7.3

PER_USER_FAIR_SHARE = (daily_limit - leads_today) for each user
```

---

**File Created:** `Calculate_Leads_Needed_By_10PM.sql` contains all the SQL queries
**Run Location:** Supabase SQL Editor or your database client

**Next Steps:** Copy the SQL from the file and run it to get your exact calculation! 🚀
