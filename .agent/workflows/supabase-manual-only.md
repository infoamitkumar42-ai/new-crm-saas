---
description: STRICT RULE - No automatic database operations on Supabase
---

# 🚨 CRITICAL RULE: SUPABASE DATABASE ACCESS

## ⛔ ABSOLUTE RESTRICTIONS:

1. **NEVER auto-run any Supabase operations** without explicit user permission
2. **NEVER execute `.cjs` scripts** that interact with database automatically
3. **NEVER use `run_command node script.cjs`** for database operations without asking first

## ✅ ALLOWED ACTIONS:

1. **CREATE SQL queries** for user to run manually in Supabase Dashboard
2. **CREATE scripts** but DO NOT RUN them - let user decide
3. **ASK permission** before any database read/write operation

## 📋 WORKFLOW FOR DATABASE TASKS:

1. User requests data or operation
2. I create SQL query (not script)
3. User copies SQL to Supabase Dashboard -> SQL Editor
4. User runs manually and shares result
5. I analyze the result

## 🔒 REASON:

- Automatic scripts were giving inaccurate data
- `total_leads_received` field was not synced with actual leads
- Only manual SQL verification gives accurate results

## 📅 EFFECTIVE DATE: 2026-02-02

---

**THIS RULE OVERRIDES ALL OTHER AUTOMATION PREFERENCES FOR SUPABASE.**
