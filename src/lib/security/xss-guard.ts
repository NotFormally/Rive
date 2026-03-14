/**
 * xss-guard.ts — Cross-Site Scripting (XSS) Detection & Sanitization
 *
 * Detects and neutralizes XSS payloads in user-generated content
 * before it gets stored in the database or rendered in the UI.
 *
 * Covers:
 *   1. Reflected XSS — payloads in URL params, form inputs
 *   2. Stored XSS — malicious content in logbook notes, restaurant names, etc.
 *   3. DOM XSS — payloads that exploit client-side rendering
 *   4. Mutation XSS (mXSS) — payloads that mutate during browser parsing
 */

// ── Types ──────────────────────────────────────────────────────────────────

export type XssVerdict = {
  safe: boolean;
  score: number;         // 0 = clean, 100 = definitely malicious
  flags: string[];
  sanitized: string;     // Cleaned version (always provided)
};

// ── XSS Pattern Definitions ───────────────────────────────────────────────

const XSS_PATTERNS: { regex: RegExp; weight: number; id: string }[] = [
  // ── Script injection ──
  { regex: /<\s*script\b/i, weight: 95, id: 'script_tag' },
  { regex: /<\s*\/\s*script\s*>/i, weight: 95, id: 'script_close_tag' },
  { regex: /javascript\s*:/i, weight: 90, id: 'javascript_protocol' },
  { regex: /vbscript\s*:/i, weight: 90, id: 'vbscript_protocol' },
  { regex: /data\s*:\s*text\/html/i, weight: 85, id: 'data_html_protocol' },

  // ── Event handlers ──
  { regex: /\bon\w+\s*=\s*["'`]/i, weight: 90, id: 'event_handler_quoted' },
  { regex: /\bon(load|error|click|mouseover|focus|blur|submit|change|input|keydown|keyup|keypress|mouseenter|mouseleave|contextmenu|dblclick|drag|drop|scroll|resize|unload|beforeunload|hashchange|popstate|storage|message|online|offline)\s*=/i, weight: 95, id: 'event_handler_specific' },

  // ── HTML injection ──
  { regex: /<\s*(iframe|embed|object|applet|form|input|button|textarea|select|meta|link|base|svg|math)\b/i, weight: 80, id: 'dangerous_html_tag' },
  { regex: /<\s*img\b[^>]*\bon\w+\s*=/i, weight: 95, id: 'img_event_handler' },
  { regex: /<\s*a\b[^>]*\bhref\s*=\s*["']?\s*javascript/i, weight: 95, id: 'a_href_javascript' },
  { regex: /<\s*body\b[^>]*\bon\w+/i, weight: 95, id: 'body_event_handler' },

  // ── SVG-based XSS ──
  { regex: /<\s*svg\b[^>]*\bon\w+/i, weight: 95, id: 'svg_event_handler' },
  { regex: /<\s*svg\b[\s\S]*<\s*script/i, weight: 95, id: 'svg_script' },
  { regex: /<\s*animate\b[^>]*\bon\w+/i, weight: 90, id: 'svg_animate_handler' },
  { regex: /<\s*set\b[^>]*\bon\w+/i, weight: 90, id: 'svg_set_handler' },

  // ── Expression injection ──
  { regex: /expression\s*\(/i, weight: 80, id: 'css_expression' },
  { regex: /url\s*\(\s*["']?\s*javascript:/i, weight: 90, id: 'css_url_javascript' },
  { regex: /@import\s+(url\s*\(|["'])/i, weight: 70, id: 'css_import' },
  { regex: /binding\s*:\s*url\s*\(/i, weight: 85, id: 'moz_binding' },

  // ── Template injection (React/Angular/Vue) ──
  { regex: /\{\{.*\}\}/i, weight: 40, id: 'template_expression' },
  { regex: /\$\{.*\}/i, weight: 50, id: 'template_literal' },
  { regex: /ng-\w+\s*=/i, weight: 50, id: 'angular_directive' },
  { regex: /v-\w+\s*=/i, weight: 50, id: 'vue_directive' },
  { regex: /dangerouslySetInnerHTML/i, weight: 80, id: 'react_dangerous_html' },
  { regex: /constructor\s*[\.\[]\s*(constructor|prototype)/i, weight: 90, id: 'constructor_chain_xss' },
  { regex: /\$\{[^}]*(constructor|prototype|__proto__|alert|eval|Function)\b/i, weight: 85, id: 'template_code_exec' },

  // ── Encoding evasion ──
  { regex: /&#\d{1,7};/g, weight: 30, id: 'html_decimal_entity' },
  { regex: /&#x[0-9a-f]{1,6};/gi, weight: 30, id: 'html_hex_entity' },
  { regex: /\\u[0-9a-f]{4}/gi, weight: 25, id: 'unicode_escape_xss' },
  { regex: /\\x[0-9a-f]{2}/gi, weight: 30, id: 'hex_escape' },
  { regex: /%3[cC].*%3[eE]/g, weight: 60, id: 'url_encoded_tags' },
  { regex: /\x00/g, weight: 70, id: 'null_byte' },

  // ── DOM manipulation ──
  { regex: /document\s*\.\s*(write|writeln|cookie|domain|location)\b/i, weight: 80, id: 'dom_manipulation' },
  { regex: /window\s*\.\s*(location|open|eval|execScript|setTimeout|setInterval)\b/i, weight: 80, id: 'window_manipulation' },
  { regex: /\.innerHTML\s*=/i, weight: 70, id: 'innerhtml_assignment' },
  { regex: /\.outerHTML\s*=/i, weight: 70, id: 'outerhtml_assignment' },
  { regex: /\.insertAdjacentHTML\s*\(/i, weight: 70, id: 'insert_adjacent_html' },
  { regex: /eval\s*\(/i, weight: 85, id: 'eval_call' },
  { regex: /Function\s*\(/i, weight: 80, id: 'function_constructor' },

  // ── Obfuscation techniques ──
  { regex: /String\s*\.\s*fromCharCode/i, weight: 75, id: 'fromcharcode' },
  { regex: /atob\s*\(/i, weight: 60, id: 'atob_decode' },
  { regex: /btoa\s*\(/i, weight: 40, id: 'btoa_encode' },
  { regex: /constructor\s*\[\s*["']return/i, weight: 90, id: 'constructor_return' },
  { regex: /\[\s*["']constructor["']\s*\]/i, weight: 85, id: 'bracket_constructor' },

  // ── RIVE-specific stored XSS vectors ──
  { regex: /<\s*\w+[^>]*\bstyle\s*=\s*["'][^"']*expression/i, weight: 85, id: 'style_expression' },
  { regex: /<\s*\w+[^>]*\bstyle\s*=\s*["'][^"']*url\s*\(\s*javascript/i, weight: 95, id: 'style_javascript_url' },
];

// ── Core XSS Guard ─────────────────────────────────────────────────────────

/**
 * Analyze input for XSS payloads.
 *
 * @param input - User-provided string (note, name, comment, etc.)
 * @returns XssVerdict with safety assessment and sanitized version
 */
export function guardXss(input: string): XssVerdict {
  const flags: string[] = [];
  let score = 0;

  for (const pattern of XSS_PATTERNS) {
    const matches = input.match(pattern.regex);
    if (matches) {
      score += pattern.weight;
      flags.push(pattern.id);
    }
    // Reset lastIndex for global patterns
    pattern.regex.lastIndex = 0;
  }

  // Cap at 100
  score = Math.min(score, 100);

  // Sanitize regardless of verdict
  const sanitized = sanitizeXss(input);

  return {
    safe: score < 50, // Lower threshold than prompt injection — XSS is always bad
    score,
    flags,
    sanitized,
  };
}

// ── Sanitization ───────────────────────────────────────────────────────────

/**
 * Remove XSS payloads from a string while preserving legitimate content.
 */
export function sanitizeXss(input: string): string {
  let cleaned = input;

  // Remove null bytes
  cleaned = cleaned.replace(/\x00/g, '');

  // Remove script tags and content
  cleaned = cleaned.replace(/<\s*script\b[^>]*>[\s\S]*?<\s*\/\s*script\s*>/gi, '');
  cleaned = cleaned.replace(/<\s*script\b[^>]*\/?>/gi, '');

  // Remove dangerous tags (keep content)
  cleaned = cleaned.replace(/<\s*\/?\s*(iframe|embed|object|applet|form|meta|link|base|svg|math)\b[^>]*>/gi, '');

  // Remove event handlers from remaining tags
  cleaned = cleaned.replace(/\s+on\w+\s*=\s*["'][^"']*["']/gi, '');
  cleaned = cleaned.replace(/\s+on\w+\s*=\s*[^\s>]+/gi, '');

  // Neutralize javascript: protocol
  cleaned = cleaned.replace(/javascript\s*:/gi, 'blocked:');
  cleaned = cleaned.replace(/vbscript\s*:/gi, 'blocked:');

  // Neutralize data:text/html
  cleaned = cleaned.replace(/data\s*:\s*text\/html/gi, 'blocked:text/html');

  // Encode remaining < and > that look like tags
  cleaned = cleaned.replace(/<(\s*\w+[^>]*on\w+\s*=)/gi, '&lt;$1');

  return cleaned;
}

// ── Quick Guard for API Routes ─────────────────────────────────────────────

/**
 * Quick XSS check that returns a Response if blocked, or null if safe.
 *
 * @example
 * ```ts
 * const blocked = quickXssGuard(restaurantName, 'signup:name');
 * if (blocked) return blocked;
 * ```
 */
export function quickXssGuard(input: string, context: string): Response | null {
  const verdict = guardXss(input);

  if (!verdict.safe) {
    console.warn(`[xss-guard] BLOCKED on ${context} — score=${verdict.score}, flags=[${verdict.flags.join(', ')}]`);
    return new Response(
      JSON.stringify({
        error: 'Contenu bloqué : code potentiellement dangereux détecté.',
        code: 'XSS_DETECTED',
        flags: verdict.flags,
      }),
      { status: 403, headers: { 'Content-Type': 'application/json' } }
    );
  }

  return null;
}

/**
 * Sanitize multiple fields and return cleaned versions.
 * Use when you want to allow content but strip dangerous parts.
 */
export function sanitizeFields<T extends Record<string, string | undefined>>(
  fields: T
): T {
  const result = { ...fields };
  for (const [key, value] of Object.entries(result)) {
    if (typeof value === 'string') {
      (result as Record<string, string>)[key] = sanitizeXss(value);
    }
  }
  return result;
}
