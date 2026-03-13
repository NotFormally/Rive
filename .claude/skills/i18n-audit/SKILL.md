# i18n Audit & Propagation

Scan source files for hardcoded user-facing strings, add translation keys, and propagate to all 25+ locales.

## Steps

### 1. Scan for hardcoded strings
- Use a Task agent to scan all `.tsx` and `.ts` files under `src/app/` and `src/components/` for hardcoded user-facing strings (French or English text in JSX, alert(), toast(), placeholder attributes, aria-label, title attributes)
- Ignore: console.log, comments, import paths, CSS class names, technical identifiers
- Output a list: file, line number, hardcoded string, suggested key name

### 2. Add keys to base locale files
- For each hardcoded string found:
  1. Add the key to `messages/en.json` under the appropriate namespace
  2. Add the French translation to `messages/fr.json`
  3. Replace the hardcoded string in the source file with `t('namespace.key')` or `useTranslations('Namespace')` pattern
- Follow existing namespace conventions (e.g., `Common`, `Gouvernail`, `Sidebar`)

### 3. Propagate to all locales
- List all locale files: `ls messages/*.json`
- For each locale file (excluding en.json and fr.json which are already done):
  - Add the new keys with the English value as fallback
  - Spawn sub-agents in batches of 10 locales for parallel processing
- Verify all files have the same key count after propagation

### 4. Verify
- Run `npx next build` to catch any broken imports or missing keys
- Run `npx next lint` to check for remaining i18n violations
- Report: total keys added, total files modified, any remaining hardcoded strings

## Key Locale Files
- `messages/en.json` — English (base)
- `messages/fr.json` — French (primary)
- 61 other locale files in `messages/` (regional variants included)

## Rules
- Never delete existing keys — only add new ones
- Use descriptive key names following existing patterns (snake_case within namespaces)
- If unsure about a translation, use the English value as placeholder and flag it for review
