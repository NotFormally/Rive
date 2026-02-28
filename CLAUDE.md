# CLAUDE.md — Rive Project Instructions

## General Principles

- When I ask you to connect to or set up an external service/API, first check if it's already installed and running before attempting installation or setup steps.
- Before making any changes, use a task agent to explore the project structure, identify key files, and understand the architecture. Then present me a numbered plan of what you'll change and why. Wait for my approval before editing.

## Tech Stack

- Primary languages: TypeScript (main), Python (secondary), Markdown (documentation). When generating code, default to TypeScript unless explicitly told otherwise.

## Communication Style

- When I say 'install these' or give a vague instruction, look at the most recent context (clipboard, previous message, open files) before asking for clarification. If still unclear, propose your best guess and ask for confirmation rather than asking an open-ended question.
- For complex tasks, if I haven't provided a structured brief, ask me to fill in this template before proceeding:
  - **GOAL:** what I want to achieve
  - **CURRENT STATE:** what's already set up/running
  - **CONSTRAINTS:** things you should NOT assume
  - **FIRST STEP:** Before coding, confirm your understanding and ask any clarifying questions.

## Debugging

- When debugging hardware/IoT integrations (lights, speakers, etc.), never assume device capabilities. Always query the device API for its actual features before proceeding.

## Environment & Config

- For environment variable and shell config changes: after modifying one config file (e.g., ~/.zshrc), always check for other sourced files (~/.zprofile, ~/.bash_profile, ~/.config/environment.d/, etc.) that might override or re-set the same variable.
