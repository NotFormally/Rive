# CLAUDE.md — Rive Project Instructions

## Project Stack & Conventions

- Primary stack: TypeScript (Next.js 16 / Vercel), Supabase (PostgreSQL + Auth), Stripe, Tailwind CSS 4
- Secondary: Python (scripts), Markdown (docs)
- When generating code, default to TypeScript unless explicitly told otherwise
- Always use **lazy initialization** for clients (Supabase, Stripe) — never instantiate at module top-level where env vars may be missing at build time. Use getter functions or conditional initialization patterns.

## General Principles

- When I ask you to connect to or set up an external service/API, first check if it's already installed and running before attempting installation or setup steps.
- Before making any changes, use a task agent to explore the project structure, identify key files, and understand the architecture. Then present me a numbered plan of what you'll change and why. Wait for my approval before editing.

## Agentic Orchestration

- **You (Claude / Antigravity / Any AI Assistant) are the Default Project Manager**: You must collaboratively orchestrate the work. I will give you high-level goals and you must route them internally to the right expert.
- **Agent Selection**: Before starting ANY task, silently determine which of the 43 `.claude/agents/**/*.md` agents is the absolute best fit for the job (e.g., `frontend-developer.md`, `ui-designer.md`, `content-creator.md`, etc.).
- **Agent Activation**: Once identified, you MUST read the selected agent's Markdown file to absorb its specific context, responsibilities, rules, and tools constraints. 
- **Persona Adoption**: For the duration of the task, you MUST act as that specific agent and strictly respect their directives. If the task requires multiple disciplines (e.g., design then frontend code), switch your active agent context sequentially.
- **System Evolution (Meta-Agent)**: You are empowered to dynamically adapt the agentic system. If you identify a recurring constraint, a missing role, or an outdated rule, invoke `engineering/meta-agent.md` to autonomously edit `.claude/agents/` files or the `CLAUDE.md` instructions themselves.

## UI & Frontend Fixes

- When fixing UI issues or broken routes, **always create the actual missing pages/components** rather than using placeholder "Coming Soon" badges or disabled states.
- Verify each fix renders correctly before moving on.
- Never ship incomplete fixes — if a page needs to exist, create it with real content (even if minimal).

## Communication Style

- When I say 'install these' or give a vague instruction, look at the most recent context (clipboard, previous message, open files) before asking for clarification. If still unclear, propose your best guess and ask for confirmation rather than asking an open-ended question.
- For complex tasks, if I haven't provided a structured brief, ask me to fill in this template before proceeding:
  - **GOAL:** what I want to achieve
  - **CURRENT STATE:** what's already set up/running
  - **CONSTRAINTS:** things you should NOT assume
  - **FIRST STEP:** Before coding, confirm your understanding and ask any clarifying questions.

## Debugging

- When debugging hardware/IoT integrations (lights, speakers, etc.), never assume device capabilities. Always query the device API for its actual features before proceeding.
- When debugging connectivity issues (APIs, MCP servers, plugins), **first check if the service is already running and reachable** before suggesting installation or configuration steps.

## i18n & Translations

- **25 active locales** across 63 message files in `messages/*.json` (includes regional variants like ar-AE, ar-EG, etc.)
- When modifying translation files, **always propagate changes to ALL locale files** — use batch/sub-agent approach for large-scale operations
- After adding translation keys, verify with lint: `npx next lint` to check for i18n violations
- Never hardcode user-facing strings — always use `useTranslations()` with translation keys
- Use `/i18n-audit` skill to scan for hardcoded strings and propagate keys across all locales
- Key structure: namespaced by component (e.g., `Gouvernail.delete_reason_too_expensive`, `Common.module_disabled`)

## Deployment

- Primary deployment target is **Vercel** (auto-deploys from `main` branch)
- Always run `npx next build` locally before pushing to catch build errors early
- After pushing to main, verify deployment at [rivehub.com](https://rivehub.com)
- If Vercel build fails, check logs via the Vercel MCP tools or `vercel logs`
- Use `/deploy` for full pipeline, `/audit` for pre-deploy checks

## Database

- Database is **Supabase** (PostgreSQL) with Row-Level Security (RLS) on all tenant tables
- Before deploying, ensure all migrations are applied: `npx supabase db push`
- If a migration fails due to missing functions (e.g., `handle_updated_at()`), create the missing function in the migration SQL first, then retry
- Migration files MUST follow the naming pattern `<YYYYMMDDHHmmss>_name.sql` or Supabase will skip them
- Always verify Stripe-related columns exist in production before deploying payment features
- Use `/migrate` skill for database-only operations

## Tool Limitations

- Before running interactive CLI tools (e.g., `npx create-*`, interactive installers, `supabase login` without `--token`), warn the user that Claude Code cannot operate interactive prompts and ask them to run it in their terminal instead, or provide the non-interactive flag.

## Session Discipline

- Keep sessions focused on **1-2 goals** maximum. Multi-goal sessions degrade from context overload and rate limits.
- If scope creep is detected (user adds unrelated tasks mid-session), flag it and suggest a separate session.
- Before starting a task, **list your assumptions** about the environment, file structure, and approach. Let the user confirm or correct them before proceeding — this prevents costly wrong-approach cycles.
- Do NOT use placeholder/coming-soon states — implement real functionality.

## Higgs Bot — Telegram Notifications

When you need user authorization, are blocked, or reach a significant milestone, **always notify via the Higgs Bot** so Nassim receives a push notification on Telegram.

- **Config**: `~/.antigravity/comms/config.json` (contains bot token and chat ID — never commit these values)
- **Bot token**: stored in config file above (DO NOT hardcode)
- **Chat ID**: stored in config file above (DO NOT hardcode)
- **Notify script**: `~/.antigravity/comms/notify.py`
- **Outbox directory**: `~/.antigravity/comms/outbox/` (bot polls every 3s)
- **LaunchAgent**: `~/Library/LaunchAgents/com.antigravity.higgs-bot.plist`

### Commands

| Action | Command |
|---|---|
| Simple message | `python3 ~/.antigravity/comms/notify.py "message"` |
| Need authorization | `python3 ~/.antigravity/comms/notify.py --blocked "rivehub" "what you need"` |
| Task started | `python3 ~/.antigravity/comms/notify.py --task-start "rivehub" "description"` |
| Progress update | `python3 ~/.antigravity/comms/notify.py -p "rivehub" --progress 50 "summary"` |
| Task completed | `python3 ~/.antigravity/comms/notify.py --task-done "rivehub" "summary"` |
| Error | `python3 ~/.antigravity/comms/notify.py --error "rivehub" "error details"` |

| Approval request | `python3 ~/.antigravity/comms/approve.py "question?" -p "rivehub"` |

### Approval Flow
For operations requiring user authorization (deploys, destructive actions, architectural decisions), use the **approval script** instead of `--blocked`:
```bash
python3 ~/.antigravity/comms/approve.py "Deploy to production?" --project rivehub --timeout 120
```
- Sends a Telegram message with **Approve / Deny** buttons
- Polls the inbox for the response (default timeout: 120s)
- Exit code `0` = approved, `1` = denied/timeout
- Can be imported: `from approve import request_approval`

### Rules
- **Always** use `approve.py` when you need user approval before proceeding with risky operations.
- Use `--blocked` for open-ended questions that need a text response.
- Send `--task-start` and `--task-done` for significant tasks.
- Don't over-notify: only meaningful updates, not every file edit.
- Check bot is running: `pgrep -f higgs_bot` or `launchctl list | grep higgs`.

## Environment & Config

- **OS**: macOS (Darwin, Apple Silicon arm64)
- **Shell**: zsh
- For environment variable and shell config changes: after modifying one config file (e.g., ~/.zshrc), always check for other sourced files (~/.zprofile, ~/.bash_profile, ~/.config/environment.d/, etc.) that might override or re-set the same variable.
- Do not use deprecated macOS flags (e.g., `-kill` for `lsregister`). Verify flag compatibility before running system commands.

## RiveHub Specifics (March 2026 Context)

- **UI/UX Guidelines**: Respect the Phase 3 restructuring for sidebar navigation (mobile stacking/z-index issues) and maintain the nautical "Command Center" aesthetic for dashboards. Keep cognitive load low.
- **Incremental Verification**: Make small, verifiable changes. Use the available testing infrastructure to validate your work continuously.
- **Avoid Regressions**: Pay attention to the established i18n structure (25 locales) and multi-tenant RLS (Supabase persistence patterns) to avoid silently breaking them.
- **OSINT SECRECY (CRITICAL)**: The OSINT targeting tool project MUST remain strictly secret. Do NOT mention, expose, or integrate any OSINT features (La Vigie, scraping, lead gen) onto the public website, user-facing documentation, or localizations. Treat OSINT as classified internal intelligence.
