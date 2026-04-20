# /raw — LeadFlow CRM Knowledge Base

This folder is the **persistent memory layer** for the project.
Graphify reads this folder to build the knowledge graph.

## Structure

| Folder | Purpose |
|--------|---------|
| `docs/` | Architecture docs, API references, system design |
| `decisions/` | ADRs — why we built things the way we did |
| `screenshots/` | UI screenshots, dashboard states, error images |
| `notes/` | Developer notes, debugging sessions, observations |
| `references/` | External links saved locally, third-party docs |

## How to Add Knowledge

1. Drop any `.md`, `.txt`, `.pdf`, or `.html` file in the right subfolder
2. Run `/graphify .` in your AI assistant to update the graph
3. Or run: `graphify update .` from terminal

## Key Facts (Quick Reference)

- **Project**: LeadFlow CRM — lead distribution for network marketing teams
- **Lead flow**: Meta Ads → meta-webhook → round-robin assignment → push notification
- **Night Backlog**: 10PM-8AM IST leads saved, assigned at 10AM via cron
- **Plans are quota-based** — NOT time-based. Leads exhausted = plan expired.
- **ISP bypass**: Jio/Airtel block Supabase — all data goes via api.leadflowcrm.in proxy
- **Counter rule**: ALWAYS use `increment_user_lead_counters` RPC, never direct UPDATE
- **DUAL FK bug**: leads table has both `user_id` AND `assigned_to` → always use `users!assigned_to`
