#!/usr/bin/env node
/**
 * i18n Lint — Detects hardcoded user-facing text in TSX files.
 *
 * Usage:
 *   npm run i18n:lint           # Scan src/app and src/components
 *   node scripts/i18n-lint.js   # Same
 *
 * What it catches:
 *   - Literal strings in JSX text content (between tags)
 *   - Hardcoded placeholder="..." attributes with text
 *   - Hardcoded aria-label="..." attributes with text
 *   - Hardcoded title="..." attributes with text
 *   - Hardcoded alt="..." attributes with text
 *
 * What it ignores:
 *   - Strings that are purely numeric, punctuation, or symbols
 *   - CSS class names, URLs, file paths
 *   - Strings inside {t("...")} or {tc("...")} calls
 *   - Import statements, type definitions
 *   - Comments
 *   - Password bullets (••••••••)
 *   - Brand names used standalone (RiveHub, HACCP, etc.)
 *   - Console.log and similar dev strings
 */

const fs = require("fs");
const path = require("path");

// ── Config ──────────────────────────────────────────────────────────
const SCAN_DIRS = ["src/app", "src/components"];
const EXTENSIONS = ["tsx"];

// Patterns that are NOT translatable text
const IGNORE_PATTERNS = [
  /^[\d\s.,;:!?@#$%^&*()\-+=<>{}[\]|/\\'"•·–—…€£¥₹]+$/, // Pure numbers/punctuation
  /^[A-Z_]+$/, // ALL_CAPS constants
  /^\d+(\.\d+)?$/, // Numbers like "0.01", "38.00"
  /^•+$/, // Password bullets
  /^(https?:\/\/|mailto:|tel:|\/\w)/, // URLs and paths
  /^\w+[-_]\w+/, // kebab-case or snake_case identifiers (CSS classes, keys)
  /^(true|false|null|undefined)$/, // JS literals
  /^(div|span|button|input|form|label|table|thead|tbody|tr|td|th|h[1-6]|p|a|img|svg|path)$/, // HTML tags
  /^(text|number|email|password|file|submit|checkbox|radio|hidden|date|time)$/, // input types
  /^(GET|POST|PUT|DELETE|PATCH)$/, // HTTP methods
  /^(id|name|class|className|style|href|src|alt|type|value|key|ref|onClick|onChange|onSubmit)$/, // React/HTML attrs
  /^(Rive|Hub|RiveHub|HACCP|POS|Stripe|Toast|Square|Supabase|Vercel|Claude|CCP|CSV|PDF|QR|AI|IA)$/, // Brand names & acronyms
  /^(application\/json|text\/plain|text\/csv|image\/\*)$/, // MIME types
  /^[a-z]{2}(-[A-Z]{2})?$/, // Locale codes
  /^\*$/, // asterisk alone
  /^(ASC|DESC|asc|desc)$/, // SQL ordering
  /^#[0-9a-fA-F]{3,8}$/, // Hex colors
  /^[\s]+$/, // Whitespace only
  /^°[CF]$/, // Temperature units
  /^[\d:]+\s*(AM|PM)\s*-\s*[\d:]+\s*(AM|PM)$/, // Time ranges
  /^(ChIJ|Logo)/, // Google Place IDs, common standalone labels
  /[=|&<>]/, // Code fragments / comparisons / template logic
  /^\}.*Promise/, // TypeScript return type fragments
  /^email@/, // Placeholder email patterns
];

// Minimum length for a string to be suspicious (single chars are fine)
const MIN_LENGTH = 2;

// ── Scanner ─────────────────────────────────────────────────────────

function isTranslatableText(str) {
  const trimmed = str.trim();
  if (trimmed.length < MIN_LENGTH) return false;
  if (IGNORE_PATTERNS.some((p) => p.test(trimmed))) return false;

  // Must contain at least one letter (rules out pure symbols/numbers)
  if (!/[a-zA-ZÀ-ÿ\u0600-\u06FF\u4e00-\u9fff\u3040-\u309f\u30a0-\u30ff]/.test(trimmed))
    return false;

  return true;
}

function scanFile(filePath) {
  const content = fs.readFileSync(filePath, "utf-8");
  const lines = content.split("\n");
  const violations = [];

  // Track if we're inside a JSX return block
  let inJSX = false;
  let braceDepth = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const lineNum = i + 1;
    const trimmedLine = line.trim();

    // Skip lines annotated with i18n-ignore (same line or previous line)
    if (line.includes("i18n-ignore")) continue;
    if (i > 0 && lines[i - 1].includes("i18n-ignore")) continue;

    // Skip imports, type definitions, comments
    if (trimmedLine.startsWith("import ")) continue;
    if (trimmedLine.startsWith("//")) continue;
    if (trimmedLine.startsWith("*")) continue;
    if (trimmedLine.startsWith("type ")) continue;
    if (trimmedLine.startsWith("interface ")) continue;
    if (trimmedLine.startsWith("export type ")) continue;
    if (trimmedLine.startsWith("export interface ")) continue;
    if (trimmedLine.includes("console.")) continue;

    // Pattern 1: Hardcoded text in JSX attributes (placeholder, aria-label, title, alt)
    const attrRegex =
      /(?:placeholder|aria-label|aria-labelledby|title|alt)\s*=\s*"([^"]+)"/g;
    let attrMatch;
    while ((attrMatch = attrRegex.exec(line)) !== null) {
      const value = attrMatch[1];
      if (isTranslatableText(value)) {
        violations.push({
          line: lineNum,
          text: value,
          type: "attribute",
          context: trimmedLine.substring(0, 80),
        });
      }
    }

    // Pattern 2: Bare text between JSX tags
    // Look for lines that are just text content (not wrapped in {})
    // e.g., <p>Some hardcoded text</p> or just "Some text" between tags
    const jsxTextRegex = />([^<>{]+)</g;
    let textMatch;
    while ((textMatch = jsxTextRegex.exec(line)) !== null) {
      const text = textMatch[1].trim();
      if (isTranslatableText(text)) {
        // Extra check: skip if it looks like it's inside a template literal or expression
        if (text.startsWith("{") || text.startsWith("$")) continue;
        violations.push({
          line: lineNum,
          text: text,
          type: "jsx-text",
          context: trimmedLine.substring(0, 80),
        });
      }
    }
  }

  return violations;
}

// ── File walker (no external deps) ──────────────────────────────────

function walkDir(dir, ext) {
  let results = [];
  if (!fs.existsSync(dir)) return results;
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results = results.concat(walkDir(fullPath, ext));
    } else if (ext.some((e) => entry.name.endsWith("." + e))) {
      results.push(fullPath);
    }
  }
  return results;
}

// ── Main ────────────────────────────────────────────────────────────

function main() {
  const rootDir = path.resolve(__dirname, "..");
  let totalViolations = 0;
  let filesWithViolations = 0;

  console.log("\n  i18n Lint — Scanning for hardcoded text...\n");

  for (const dir of SCAN_DIRS) {
    const fullDir = path.join(rootDir, dir);
    const files = walkDir(fullDir, EXTENSIONS);

    for (const file of files) {
      const relPath = path.relative(rootDir, file);
      const violations = scanFile(file);

      if (violations.length > 0) {
        filesWithViolations++;
        console.log(`  ❌ ${relPath}`);
        for (const v of violations) {
          console.log(`     L${v.line} [${v.type}]: "${v.text}"`);
          totalViolations++;
        }
        console.log("");
      }
    }
  }

  console.log("─".repeat(60));
  if (totalViolations === 0) {
    console.log("  ✅ No hardcoded text found. All clean!\n");
  } else {
    console.log(
      `  ⚠️  ${totalViolations} violation(s) in ${filesWithViolations} file(s)\n`
    );
    console.log("  Fix: Replace hardcoded text with t('key') from useTranslations.");
    console.log("  See: docs/i18n-guide.md\n");
    process.exit(1);
  }
}

main();
