// Shared inline SVG icons for the SimPanel branches.

export const CollapseIcon = ({ expanded }) => (
  <svg
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    {expanded ? (
      <>
        <path d="M15 5l-7 7 7 7" />
        <path d="M19 5v14" />
      </>
    ) : (
      <>
        <path d="M9 5l7 7-7 7" />
        <path d="M5 5v14" />
      </>
    )}
  </svg>
);

export const ChevronIcon = () => (
  <svg
    width="13"
    height="13"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M9 5l7 7-7 7" />
  </svg>
);
