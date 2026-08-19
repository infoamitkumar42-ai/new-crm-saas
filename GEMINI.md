# ⛔ STOP — read AGENTS.md before changing any code in this repository.

This is a LIVE revenue system. Paying customers are owed a specific number of leads, and
"small" changes here have previously cost real money: paying members receiving zero leads for
a day, buyers sold the wrong quota, 87 users locked out of the app.

Required reading, in order:

  1. AGENTS.md                    Rules and the traps that have actually caused damage
  2. docs/SYSTEM-OVERVIEW.md      How the system works: lead flow, routing paths, data model
  3. docs/AGENT-PROTOCOL.md       Required workflow for making and proving a change
  4. bugfix.md                    Every bug ever found — check here BEFORE debugging anything

Running many steps without a human between them (autonomous / background / multi-agent)?
Also read docs/AUTONOMOUS-AGENT-RULES.md — hard stops, premise re-verification, parallel agents.

⚠️ FIRST, MAKE SURE YOUR CHECKOUT IS CURRENT: `git pull origin main`
An onboarding test on 2026-08-19 found an agent answering from a clone that was several
commits behind — it reported bugfix.md as ending at BUG-010 when it ends at BUG-016, and
never saw AGENTS.md or docs/ at all. Stale docs are worse than no docs, because they are
quoted with confidence. If CLAUDE.md is under ~1,900 lines or bugfix.md has no BUG-016,
you are on an old checkout. Pull before answering anything.

Non-negotiable rules (full list in AGENTS.md):

  - Never edit auth/useAuth.tsx, supabaseClient.ts, App.tsx, vite.config.ts or src/sw.ts
    without explicit approval for that specific change.
  - Never change DB schema, RPCs or RLS without showing the SQL and getting approval first.
  - One logical change per commit. Branch + PR; never push to main.
  - Identify users by email, never by name — several people here share names.
  - Verify against the live database before you write code, and again before you claim it works.

If you are unsure, stop and ask. Guessing is the failure mode this file exists to prevent.

---

<!-- code-review-graph MCP tools -->
## MCP Tools: code-review-graph

**IMPORTANT: This project has a knowledge graph. ALWAYS use the
code-review-graph MCP tools BEFORE using Grep/Glob/Read to explore
the codebase.** The graph is faster, cheaper (fewer tokens), and gives
you structural context (callers, dependents, test coverage) that file
scanning cannot.

### When to use graph tools FIRST

- **Exploring code**: `semantic_search_nodes` or `query_graph` instead of Grep
- **Understanding impact**: `get_impact_radius` instead of manually tracing imports
- **Code review**: `detect_changes` + `get_review_context` instead of reading entire files
- **Finding relationships**: `query_graph` with callers_of/callees_of/imports_of/tests_for
- **Architecture questions**: `get_architecture_overview` + `list_communities`

Fall back to Grep/Glob/Read **only** when the graph doesn't cover what you need.

### Key Tools

| Tool | Use when |
|------|----------|
| `detect_changes` | Reviewing code changes — gives risk-scored analysis |
| `get_review_context` | Need source snippets for review — token-efficient |
| `get_impact_radius` | Understanding blast radius of a change |
| `get_affected_flows` | Finding which execution paths are impacted |
| `query_graph` | Tracing callers, callees, imports, tests, dependencies |
| `semantic_search_nodes` | Finding functions/classes by name or keyword |
| `get_architecture_overview` | Understanding high-level codebase structure |
| `refactor_tool` | Planning renames, finding dead code |

### Workflow

1. The graph auto-updates on file changes (via hooks).
2. Use `detect_changes` for code review.
3. Use `get_affected_flows` to understand impact.
4. Use `query_graph` pattern="tests_for" to check coverage.

## graphify

This project has a graphify knowledge graph at graphify-out/.

Rules:
- Before answering architecture or codebase questions, read graphify-out/GRAPH_REPORT.md for god nodes and community structure
- If graphify-out/wiki/index.md exists, navigate it instead of reading raw files
- After modifying code files in this session, run `graphify update .` to keep the graph current (AST-only, no API cost)
