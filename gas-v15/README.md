# LeadFlow v15.0 - Deployment Guide

## 📁 Files in this Folder

| File | Purpose |
|------|---------|
| `SQL_RPC_Functions.sql` | Run FIRST in Supabase SQL Editor |
| `Config.gs` | Configuration constants (copy to GAS) |
| `SupabaseClient.gs` | Database operations (copy to GAS) |
| `Utils.gs` | Utility functions (copy to GAS) |
| `LeadDistributor.gs` | Main distribution engine (copy to GAS) |
| `Notifications.gs` | Email/WhatsApp with 🟦 signaling (copy to GAS) |
| `Triggers.gs` | Trigger management (copy to GAS) |

---

## 🚀 Deployment Steps

### Step 1: Deploy SQL (Supabase)

1. Open Supabase Dashboard → SQL Editor
2. Copy contents of `SQL_RPC_Functions.sql`
3. Run the SQL
4. Verify functions exist:
   ```sql
   SELECT proname FROM pg_proc 
   WHERE proname IN ('increment_lead_count_safe', 'reset_daily_leads');
   ```

### Step 2: Add Missing Column (If needed)

Check if `last_lead_assigned_at` exists:
```sql
SELECT column_name FROM information_schema.columns 
WHERE table_name = 'users_subscription' AND column_name = 'last_lead_assigned_at';
```

If missing, run:
```sql
ALTER TABLE users_subscription ADD COLUMN last_lead_assigned_at TIMESTAMPTZ DEFAULT NULL;
```

### Step 3: Deploy GAS Code

1. Open Google Apps Script project
2. **Delete** old files: `Restore.gs`, `HybridDistributor.gs`, `LeadProcessor.gs`
3. **Create** new files and copy code:
   - Config.gs
   - SupabaseClient.gs
   - Utils.gs
   - LeadDistributor.gs
   - Notifications.gs
   - Triggers.gs
4. Keep `Code.gs` (web handlers - minimal changes needed)

### Step 4: Update Secrets

Run `setupSecrets()` in GAS to update credentials:
```javascript
function setupSecrets() {
  var props = PropertiesService.getScriptProperties();
  props.setProperties({
    'SUPABASE_URL': 'https://YOUR_PROJECT.supabase.co',
    'SUPABASE_KEY': 'YOUR_SERVICE_ROLE_KEY',
    'ADMIN_EMAIL': 'your@email.com'
  });
}
```

### Step 5: Setup Triggers

Run `setupAllTriggers()` in GAS:
- Distribution: Every 5 minutes
- Midnight Reset: Daily at 12:05 AM IST
- Health Check: Every 6 hours

### Step 6: Test

1. Run `testSupabaseConnection()` - Should return ✅
2. Run `testRPCFunction()` - Should be callable
3. Run `distributorHealthCheck()` - Full system check
4. Run `manualDistribute()` - Test distribution

---

## 📊 v15.0 Rules Summary

| Rule | Description | Implementation |
|------|-------------|----------------|
| A | Active Hours (8 AM - 10 PM) | `isWithinActiveHours()` in Utils.gs |
| B | Backlog Release at 11 AM | `isAfterBacklogRelease()` in Utils.gs |
| C | 2:1 Ratio (Real-time : Night) | `mixLeadsWithRatio()` in Utils.gs |
| D | Visual Signal for Night Leads | 🟦 + Hindi message in Notifications.gs |
| E | 15-min Focus Gap per User | SQL RPC `increment_lead_count_safe` |
| F | Atomic Safety (Race Condition) | SQL RPC with row-level locking |

---

## 🎯 Priority Order

1. **Booster** (Priority 1)
2. **Manager** (Priority 2)
3. **Supervisor** (Priority 3)
4. **Starter** (Priority 4)

---

## ⚡ Speed Logic

- If a user is in 15-min cooling period → **SKIP immediately**
- No waiting, no delays
- Move to next available user instantly
- Lead is assigned to highest-priority AVAILABLE user

---

## 🔧 Troubleshooting

### RPC Returns False for All Users
- Check `plan_status` is 'Active' in `users_subscription`
- Check `leads_sent` < `daily_limit`
- Check `last_lead_assigned_at` is NULL or > 15 min ago

### No Leads Distributed
- Verify time is between 8 AM - 10 PM IST
- Check for unassigned leads with `status = 'New'`
- Run `distributorHealthCheck()` for diagnostics

### Missing Column Error
Run: `ALTER TABLE users_subscription ADD COLUMN last_lead_assigned_at TIMESTAMPTZ;`

---

## 📧 Support

For issues, check logs in Google Apps Script → Executions

Version: 15.0
Build Date: 2026-01-08
