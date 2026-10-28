type P = { size?: number };
const svg = (size: number) => ({
  width: size,
  height: size,
  viewBox: "0 0 24 24",
  "aria-hidden": true as const,
});

export const PlayIcon = ({ size = 22 }: P) => (
  <svg {...svg(size)}>
    <path d="M7 4l13 8-13 8z" fill="currentColor" />
  </svg>
);
export const PauseIcon = ({ size = 22 }: P) => (
  <svg {...svg(size)}>
    <path d="M6 4h4v16H6zM14 4h4v16h-4z" fill="currentColor" />
  </svg>
);
export const PrevIcon = ({ size = 18 }: P) => (
  <svg {...svg(size)}>
    <path d="M6 5h2v14H6zM20 5v14L9 12z" fill="currentColor" />
  </svg>
);
export const NextIcon = ({ size = 18 }: P) => (
  <svg {...svg(size)}>
    <path d="M16 5h2v14h-2zM4 5v14l11-7z" fill="currentColor" />
  </svg>
);
export const ShuffleIcon = ({ size = 16 }: P) => (
  <svg {...svg(size)} fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M16 3h5v5M4 20L21 3M21 16v5h-5M15 15l6 6M4 4l5 5" />
  </svg>
);
export const RepeatIcon = ({ size = 16 }: P) => (
  <svg {...svg(size)} fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M17 1l4 4-4 4" />
    <path d="M3 11V9a4 4 0 0 1 4-4h14M7 23l-4-4 4-4" />
    <path d="M21 13v2a4 4 0 0 1-4 4H3" />
  </svg>
);
export const PinIcon = ({ size = 16 }: P) => (
  <svg {...svg(size)} fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M12 22s7-6.2 7-12a7 7 0 0 0-14 0c0 5.8 7 12 7 12z" />
    <circle cx="12" cy="10" r="2.5" />
  </svg>
);
