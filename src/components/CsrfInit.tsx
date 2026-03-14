'use client';

import { useEffect } from 'react';
import { installCsrfInterceptor } from '@/lib/csrf-client';

/**
 * CsrfInit — Invisible client component that installs the CSRF
 * fetch interceptor on app mount. Add once to the root layout.
 *
 * This ensures all mutating fetch requests to /api/* routes
 * automatically include the x-csrf-token header.
 */
export function CsrfInit() {
  useEffect(() => {
    installCsrfInterceptor();
  }, []);

  return null;
}
