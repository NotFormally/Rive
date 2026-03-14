/**
 * csrf-client.ts — Browser-side CSRF Token Interceptor
 *
 * Auto-injects the CSRF token header into all same-origin mutating
 * fetch requests (POST, PUT, PATCH, DELETE) to /api/* routes.
 *
 * This works transparently with existing code — no need to modify
 * individual fetch calls. Just call `installCsrfInterceptor()` once
 * on app initialization (done by <CsrfInit /> component).
 *
 * The CSRF cookie is set by the middleware on every page visit.
 * This script reads it and adds it as a custom header (Double Submit Cookie pattern).
 */

const CSRF_COOKIE_NAME = 'rive-csrf-token';
const CSRF_HEADER_NAME = 'x-csrf-token';

/**
 * Read the CSRF token from the cookie.
 */
function getCsrfToken(): string | null {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(
    new RegExp(`(?:^|;\\s*)${CSRF_COOKIE_NAME}=([^;]*)`)
  );
  return match ? match[1] : null;
}

/**
 * Check if a URL is a same-origin /api/ request.
 */
function isSameOriginApi(input: RequestInfo | URL): boolean {
  let url: string;

  if (typeof input === 'string') {
    url = input;
  } else if (input instanceof URL) {
    url = input.toString();
  } else if (input instanceof Request) {
    url = input.url;
  } else {
    return false;
  }

  // Relative /api/ paths are always same-origin
  if (url.startsWith('/api/')) return true;

  // Absolute URLs: check if same origin + /api/ path
  try {
    const parsed = new URL(url);
    return (
      parsed.origin === globalThis.location?.origin &&
      parsed.pathname.startsWith('/api/')
    );
  } catch {
    return false;
  }
}

let _installed = false;

/**
 * Monkey-patch globalThis.fetch to auto-inject CSRF tokens.
 *
 * Safe to call multiple times (idempotent).
 * Only runs in browser context (no-op on server).
 */
export function installCsrfInterceptor(): void {
  // Only run in browser
  if (typeof globalThis === 'undefined' || typeof document === 'undefined') return;
  // Only install once
  if (_installed) return;
  _installed = true;

  const originalFetch = globalThis.fetch;

  globalThis.fetch = function csrfFetch(
    input: RequestInfo | URL,
    init?: RequestInit
  ): Promise<Response> {
    const method = (init?.method || 'GET').toUpperCase();
    const isMutating = ['POST', 'PUT', 'PATCH', 'DELETE'].includes(method);

    if (isMutating && isSameOriginApi(input)) {
      const token = getCsrfToken();
      if (token) {
        const headers = new Headers(init?.headers);
        // Don't overwrite if already set explicitly
        if (!headers.has(CSRF_HEADER_NAME)) {
          headers.set(CSRF_HEADER_NAME, token);
        }
        return originalFetch.call(globalThis, input, { ...init, headers });
      }
    }

    return originalFetch.call(globalThis, input, init);
  };
}
