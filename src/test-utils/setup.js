// Vitest global setup (runs for every test file, node + jsdom).
// jest-dom matchers (toBeInTheDocument, etc.) are pure expect extensions and
// are safe to register in node env — they only activate when a DOM is present.
import '@testing-library/jest-dom/vitest';
import { afterEach } from 'vitest';

// Component tests seed localStorage to drive AppProvider (see renderWithProviders).
// Clear between tests so seeds don't leak across cases. `localStorage` only
// exists in jsdom files; guard so the node engine suite is unaffected.
afterEach(() => {
  if (typeof localStorage !== 'undefined') localStorage.clear();
});
