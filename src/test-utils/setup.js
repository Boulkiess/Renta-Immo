// Vitest global setup (runs for every test file, node + jsdom).
// jest-dom matchers (toBeInTheDocument, etc.) are pure expect extensions and
// are safe to register in node env — they only activate when a DOM is present.
import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach } from 'vitest';

// Component tests seed localStorage to drive AppProvider (see renderWithProviders).
// Clear between tests so seeds don't leak across cases. `localStorage` only
// exists in jsdom files; guard so the node engine suite is unaffected.
// cleanup() unmounts mounted React trees so renders don't accumulate in
// document.body across cases; guarded to jsdom files (no-op in node env).
afterEach(() => {
  if (typeof document !== 'undefined') cleanup();
  if (typeof localStorage !== 'undefined') localStorage.clear();
});
