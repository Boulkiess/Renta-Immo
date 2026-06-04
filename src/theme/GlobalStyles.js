import { createGlobalStyle } from 'styled-components';

export const GlobalStyles = createGlobalStyle`
  /* Inject theme as CSS variables so canvas renderers and legacy CSS still work */
  :root {
    --bg:      ${({ theme }) => theme.bg};
    --surface: ${({ theme }) => theme.surface};
    --s2:      ${({ theme }) => theme.s2};
    --border:  ${({ theme }) => theme.border};
    --text:    ${({ theme }) => theme.text};
    --muted:   ${({ theme }) => theme.muted};
    --subtle:  ${({ theme }) => theme.subtle};
    --a:       ${({ theme }) => theme.a};
    --b:       ${({ theme }) => theme.b};
    --c:       ${({ theme }) => theme.c};
    --red:     ${({ theme }) => theme.red};
    --green:   ${({ theme }) => theme.green};
    --yellow:  ${({ theme }) => theme.yellow};
    --mono:    ${({ theme }) => theme.mono};
    --val:     ${({ theme }) => theme.inputColor};
  }

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  body {
    background: ${({ theme }) => theme.bg};
    color: ${({ theme }) => theme.text};
    font-family: 'Hanken Grotesk', sans-serif;
    font-size: 13px;
    overflow-x: hidden;
    min-height: 100vh;
  }

  /* Mobile: lock the page so the body never scrolls — only the inner content and
     sheets do. Without this, iOS Safari grows the body past the visible area at the
     top of the page and the whole mobile shell (bottom nav included) scrolls up and
     detaches from the bottom edge. The shell itself uses 100dvh (cf. MobileShell). */
  @media (max-width: 767px) {
    html, body {
      height: 100vh;
      height: 100dvh;
      min-height: 0;
      overflow: hidden;
      overscroll-behavior: none;
    }
  }

  input[type=number]::-webkit-inner-spin-button,
  input[type=number]::-webkit-outer-spin-button { opacity: 1; height: 16px; cursor: pointer; }
  input[type=number] { -moz-appearance: textfield; }

  canvas { display: block; width: 100%; }

  table { width: 100%; border-collapse: collapse; }
  th {
    text-align: left; padding: 6px 10px;
    color: ${({ theme }) => theme.muted};
    border-bottom: 1px solid ${({ theme }) => theme.border};
    font-weight: 600; font-size: 10px;
  }
  td { padding: 7px 10px; font-size: 11px; }
  .tr { text-align: right; font-weight: 700; }

  /* Slider */
  input[type=range] {
    width: 100%; cursor: pointer; height: 4px; border-radius: 2px;
    -webkit-appearance: none; appearance: none;
    background: ${({ theme }) => theme.border};
    display: block; margin: 0;
  }
  input[type=range]::-webkit-slider-thumb {
    -webkit-appearance: none; width: 14px; height: 14px; border-radius: 50%;
    cursor: grab; border: 2px solid ${({ theme }) => theme.bg};
    box-shadow: 0 0 4px rgba(0,0,0,.6);
    background: var(--rng-col, ${({ theme }) => theme.a});
  }
  input[type=range]:active::-webkit-slider-thumb { cursor: grabbing; transform: scale(1.15); }
  input[type=range]::-moz-range-thumb {
    width: 12px; height: 12px; border-radius: 50%;
    cursor: grab; border: 2px solid ${({ theme }) => theme.bg};
    background: var(--rng-col, ${({ theme }) => theme.a});
  }
  input[type=range]:focus { outline: none; }
`;
