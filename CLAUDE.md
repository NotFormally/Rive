# CLAUDE.md — Rive Project Instructions

## Project Stack & Conventions

- Primary stack: TypeScript (Next.js 16 / Vercel), Supabase (PostgreSQL + Auth), Stripe, Tailwind CSS 4
- Secondary: Python (scripts), Markdown (docs)
- When generating code, default to TypeScript unless explicitly told otherwise
- Always use **lazy initialization** for clients (Supabase, Stripe) — never instantiate at module top-level where env vars may be missing at build time. Use getter functions or conditional initialization patterns.

## General Principles

- When I ask you to connect to or set up an external service/API, first check if it's already installed and running before attempting installation or setup steps.
- Before making any changes, use a task agent to explore the project structure, identify key files, and understand the architecture. Then present me a numbered plan of what you'll change and why. Wait for my approval before editing.

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

## Deployment & Database

- After deployment-related changes, always run `npx supabase db push` or equivalent migration commands and verify they succeed.
- If a migration fails due to missing functions (e.g., `handle_updated_at()`), create the missing function in the migration SQL first, then retry.
- Migration files MUST follow the naming pattern `<YYYYMMDDHHmmss>_name.sql` or Supabase will skip them.
- Use `/deploy` skill for the full deploy pipeline, `/migrate` for database-only, `/audit` for pre-deploy checks.

## Tool Limitations

- Before running interactive CLI tools (e.g., `npx create-*`, interactive installers, `supabase login` without `--token`), warn the user that Claude Code cannot operate interactive prompts and ask them to run it in their terminal instead, or provide the non-interactive flag.

## Environment & Config

- For environment variable and shell config changes: after modifying one config file (e.g., ~/.zshrc), always check for other sourced files (~/.zprofile, ~/.bash_profile, ~/.config/environment.d/, etc.) that might override or re-set the same variable.
