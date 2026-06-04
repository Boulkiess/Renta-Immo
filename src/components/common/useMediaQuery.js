import { useEffect, useState } from 'react';
import { MOBILE_QUERY } from '../../theme/themes.js';

/**
 * Subscribes to a CSS media query and returns whether it currently matches.
 * Re-renders the component when the match state changes (resize, orientation).
 */
export function useMediaQuery(query) {
  const [matches, setMatches] = useState(
    () => typeof window !== 'undefined' && window.matchMedia(query).matches
  );

  useEffect(() => {
    const mql = window.matchMedia(query);
    const onChange = e => setMatches(e.matches);
    setMatches(mql.matches);
    mql.addEventListener('change', onChange);
    return () => mql.removeEventListener('change', onChange);
  }, [query]);

  return matches;
}

/**
 * Single source of truth for the desktop ↔ mobile-shell switch (cf. App.jsx).
 * True below the `tablet` breakpoint.
 */
export function useIsMobile() {
  return useMediaQuery(MOBILE_QUERY);
}
