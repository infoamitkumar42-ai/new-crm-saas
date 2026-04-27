# LeadFlow CRM — AI IDE Setup Guide
## Antigravity + Claude Code Ko Galti-Proof Banane Ka Complete Guide

---

## Tera Problem Kya Hai (Summary)

1. LLM (Claude Code / Antigravity) project context bhool jaata hai
2. Hallucination karke galat code likhta hai
3. Locked files modify kar deta hai → bugs aate hain
4. Repo mein bahut zyada files hain → LLM confuse hota hai
5. Extensions (GitShit, Ralph Loop, CodeRabbit) use karne nahi aate

---

## Solution: 3 Files Jo Sab Fix Karengi

### File 1: `CLAUDE.md` (Claude Code ke liye)
- Claude Code automatically padhta hai jab project open hota hai
- Isme locked files, schema, business rules sab likha hai
- Har galti jo LLM karta hai uska prevention likha hai
- **Location:** Project root (`/CLAUDE.md`)

### File 2: `AGENTS.md` (Antigravity ke liye)
- Antigravity v1.20.3+ automatically padhta hai
- Same information as CLAUDE.md but Antigravity format mein
- **Location:** Project root (`/AGENTS.md`)

### File 3: `.cursorrules` (Cursor ke liye — agar kabhi use karo)
- Same rules in Cursor format
- **Location:** Project root (`/.cursorrules`)

> In teeno files ka content same hai — bas format alag hai. Jab bhi koi AI IDE
> tumhara project open karega, wo apni corresponding file padhega aur rules follow karega.

---

## Step-by-Step Setup

### Step 1: Files Copy Karo

Maine 2 files banayi hain:
- `CLAUDE.md` — Replace karo existing CLAUDE.md se
- `AGENTS.md` — Naya file, project root mein daalo

Commands:
```bash
cd /path/to/new-crm-saas

# Backup old CLAUDE.md
cp CLAUDE.md CLAUDE.md.backup

# Copy new files (jo maine diye hain)
# CLAUDE.md → project root
# AGENTS.md → project root
```

### Step 2: Repo Cleanup (Optional but Recommended)

Teri repo mein 150+ loose SQL/CSV/JSON files hain root mein. Ye LLM ko confuse karti hain.

Solution — ek `archive/` folder banao:
```bash
mkdir -p archive/sql-scripts
mkdir -p archive/reports-csv
mkdir -p archive/audit-data
mkdir -p archive/payloads

# Move SQL scripts
mv CHECK_*.sql VERIFY_*.sql FIX_*.sql DEBUG_*.sql archive/sql-scripts/
mv SYNC_*.sql UPDATE_*.sql DEPLOY_*.sql archive/sql-scripts/

# Move CSV reports
mv *_REPORT*.csv *_AUDIT*.csv *_Leads*.csv archive/reports-csv/
mv January_2026_Report.csv Report_Jan*.csv archive/reports-csv/

# Move JSON data files
mv *_payload.json *_leads.json archive/payloads/
mv tmp_*.json archive/payloads/

# Move text audit files
mv *_audit*.txt *_report*.txt archive/audit-data/
```

CLAUDE.md mein already likha hai "DO NOT DELETE root files" — ye archive karna safe hai, delete nahi.

### Step 3: Antigravity Awesome Skills Install Karo

Ye free skills hain jo coding accuracy improve karti hain:

```bash
# Install the skills CLI
npx antigravity-awesome-skills --antigravity

# Specific useful bundles:
# - Essentials (brainstorming, architecture)
# - Full-Stack Developer (API design, database)
# - Security Developer (security audit)
# - QA & Testing (test writing)
```

### Step 4: Free VS Code / Antigravity Extensions

Ye extensions galat code likhne se rokenge:

**Code Quality:**
- **ESLint** — JavaScript/TypeScript errors catch karta hai BEFORE commit
- **Prettier** — Code formatting consistent rakhta hai
- **TypeScript Error Translator** — TS errors ko simple English mein explain karta hai

**Git Safety:**
- **GitLens** — Har line pe dikhata hai kisne kab change kiya
- **Git Graph** — Visual git history

**Supabase:**
- **Supabase VS Code** (official) — Database schema browser

> CodeRabbit, GitShit, Ralph Loop — ye advanced tools hain. Abhi mat lagao.
> Pehle upar wale basic extensions lagao, comfortable ho jao, phir baad mein dekhna.

### Step 5: Git Discipline (Simple Version)

```bash
# Before ANY change:
git add . && git commit -m "backup before [what you're about to do]"

# After successful change:
git add . && git commit -m "done: [what you did]"

# If something breaks:
git revert HEAD
# or go back to last good state:
git log --oneline -10  # find the good commit
git checkout [commit-hash] -- [file-that-broke]
```

---

## Antigravity Mein Kaise Use Karna Hai

### Starting a New Task

Jab bhi naya kaam shuru karo, Antigravity mein ye bolo:

```
Read CLAUDE.md and AGENTS.md first. 
Then tell me what you understood about the project's locked files and rules.
Only after that, I'll give you the task.
```

Ye force karega agent ko pehle rules padhne. Agar wo sahi answer de — tabhi aage badho.

### Giving Instructions

```
❌ WRONG WAY:
"Fix the dashboard loading issue"

✅ RIGHT WAY:
"The admin dashboard (views/AdminDashboard.tsx) is showing empty plan_analytics. 
The RPC function get_admin_dashboard_data() returns '[]' for plan_analytics.
Show me the SQL fix ONLY — do not modify any TypeScript files.
I will run the SQL manually in Supabase SQL Editor."
```

### After Agent Makes Changes

```
"Show me exactly which files you changed and what lines were modified.
Do NOT make any more changes until I verify and test."
```

---

## Kab Kya Use Karna Hai

| Kaam | Kahan Karo |
|------|-----------|
| SQL scripts (fixes, queries, reports) | **Claude.ai Projects** (yahan) — main tested SQL de dunga |
| Frontend bug fix | **Antigravity** with CLAUDE.md + AGENTS.md |
| New feature (UI) | **Antigravity** — ek file at a time |
| Edge Function changes | **Claude.ai Projects** — main code dunga, tu deploy karega |
| Lead distribution / audit | **Claude.ai Projects** — CSV upload, analysis |
| Database schema change | **Claude.ai Projects** — main SQL dunga with approval |
| Emergency rollback | **Terminal** — `git revert HEAD` |

---

## Emergency Cheatsheet

```bash
# Something broke after a code change:
git revert HEAD

# Dashboard not loading:
# 1. Open browser console (F12)
# 2. Screenshot the error
# 3. Bring it to Claude.ai Projects

# User not receiving leads:
# Check in Supabase: SELECT is_active, is_online, leads_today, daily_limit 
# FROM users WHERE email = 'user@email.com';

# Push notifications not working:
# Check: SELECT * FROM push_subscriptions WHERE user_id = 'xxx';

# Payment not activating plan:
# Check Cloudflare Pages Functions logs
# Check: SELECT * FROM payments ORDER BY created_at DESC LIMIT 5;
```

---

## Summary

1. `CLAUDE.md` + `AGENTS.md` = tera project ka brain for AI agents
2. One change at a time — never batch changes
3. SQL changes → yahan Claude.ai Projects pe banao, Supabase mein paste karo
4. Frontend changes → Antigravity mein karo with context files
5. Jab doubt ho → yahan pooch pehle, phir Antigravity mein karo
6. Git commit before and after every change
7. Basic extensions lagao (ESLint, Prettier, GitLens) — fancy tools baad mein
