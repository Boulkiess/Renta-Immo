// Breakpoints (px). Theme-independent — shared across dark/light. Below `tablet`
// the app switches to the mobile shell (see useIsMobile). `MOBILE_QUERY` is the
// single source of truth for that switch.
export const bp = { mobile: 480, tablet: 768, desktop: 1024 };
export const MOBILE_QUERY = `(max-width: ${bp.tablet - 1}px)`;

export const darkTheme = {
  name: 'dark',
  bp,
  bg: '#020817',
  surface: '#0f172a',
  s2: '#0d1b2a',
  border: '#1e293b',
  text: '#e2e8f0',
  muted: '#64748b',
  subtle: '#334155',
  a: '#6C9AFF',
  b: '#FF9D5C',
  c: '#5CEFB0',
  red: '#f87171',
  green: '#4ade80',
  yellow: '#fbbf24',
  navBg: '#0e1c36',
  navText: '#dce6f7',
  navSubtle: 'rgba(255,255,255,.08)',
  navSubtle2: 'rgba(255,255,255,.15)',
  inputBg: 'transparent',
  inputColor: '#a78bfa',
  mono: "'Space Mono', monospace",
  tipBg: '#070f1e',
  popBg: '#0a1628',
};

export const lightTheme = {
  name: 'light',
  bp,
  bg: '#f1f5f9',
  surface: '#ffffff',
  s2: '#f8fafc',
  border: '#e2e8f0',
  text: '#0f172a',
  muted: '#64748b',
  subtle: '#cbd5e1',
  a: '#3b6fd4',
  b: '#c2500a',
  c: '#0d8f5e',
  red: '#dc2626',
  green: '#16a34a',
  yellow: '#b45309',
  navBg: '#0e1c36',
  navText: '#dce6f7',
  navSubtle: 'rgba(255,255,255,.08)',
  navSubtle2: 'rgba(255,255,255,.15)',
  inputBg: 'transparent',
  inputColor: '#7c3aed',
  mono: "'Space Mono', monospace",
  tipBg: '#1e293b',
  popBg: '#ffffff',
};
