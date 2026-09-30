"use
  flask: [<path key="f" d="M9 2h6M10 2v5l-4.5 8A3 3 0 0 0 8.2 19h7.6a3 3 0 0 0 2.7-4l-4.5-8V2M8 13h8"/>], client";

import type { ReactElement } from "react";

const paths: Record<string, ReactElement[]> = {
  home: [<path key="1" d="m3 10 9-7 9 7" />, <path key="2" d="M5 9.5V21h14V9.5" />, <path key="3" d="M9 21v-7h6v7" />],
  book: [<path key="1" d="M4 5.5A2.5 2.5 0 0 1 6.5 3H11v17H6.5A2.5 2.5 0 0 0 4 22z" />, <path key="2" d="M20 5.5A2.5 2.5 0 0 0 17.5 3H13v17h4.5A2.5 2.5 0 0 1 20 22z" />],
  practice: [<rect key="1" x="4.5" y="3.5" width="15" height="17" rx="2.5" />, <path key="2" d="m8 12 2.3 2.3L16.5 8" />, <path key="3" d="M8 7h2M8 17h2" />],
  timer: [<circle key="1" cx="12" cy="13" r="7.5" />, <path key="2" d="M9 2h6M12 2v3M17.5 7.5 19 6" />],
  note: [<path key="1" d="M6 3.5h9.5L19 7v13.5H6z" />, <path key="2" d="M15 3.5V8h4M9 12h7M9 16h5" />],
  chart: [<path key="1" d="M4 19.5V10M10 19.5V6M16 19.5V12M22 19.5V3.5" />],
  users: [<circle key="1" cx="9" cy="8" r="3.2" />, <path key="2" d="M3.5 20c.4-3.7 2.2-5.8 5.5-5.8s5.1 2.1 5.5 5.8M16.2 10a2.6 2.6 0 1 0 0-5.2M16 14.5c2.7-.2 4.6 1.6 5 4.5" />],
  "user-plus": [<circle key="1" cx="9" cy="8" r="3.2" />, <path key="2" d="M3.5 20c.4-3.7 2.2-5.8 5.5-5.8s5.1 2.1 5.5 5.8M18 11v7M14.5 14.5h7" />],
  message: [<path key="1" d="M4 5.5h16v11H9l-5 4z" />, <path key="2" d="M8 9h8M8 12h5" />],
  groups: [<path key="1" d="M7 5.5a3 3 0 1 1 0 6 3 3 0 0 1 0-6zM17 6.5a2.5 2.5 0 1 1 0 5" />, <path key="2" d="M1.5 20c.5-3.8 2.4-5.5 5.5-5.5s5 1.7 5.5 5.5M14 15c2.6-.8 5.8.8 6.8 5" />],
  target: [<circle key="1" cx="12" cy="12" r="8" />, <circle key="2" cx="12" cy="12" r="4" />, <circle key="3" cx="12" cy="12" r="1.2" fill="currentColor" stroke="none" />],
  refresh: [<path key="1" d="M20 11a8 8 0 0 0-13.8-4L4 10" />, <path key="2" d="M4 5v5h5M4 13a8 8 0 0 0 13.8 4L20 14" />, <path key="3" d="M20 19v-5h-5" />],
  trophy: [<path key="1" d="M8 4h8v4a4 4 0 0 1-8 0zM5 6H3v2a4 4 0 0 0 4 4M19 6h2v2a4 4 0 0 1-4 4M12 12v5M8 21h8M9 17h6" />],
  bell: [<path key="1" d="M6 10a6 6 0 0 1 12 0c0 5 2 5 2 7H4c0-2 2-2 2-7z" />, <path key="2" d="M10 21h4" />],
  briefcase: [<rect key="1" x="3" y="7" width="18" height="13" rx="2" />, <path key="2" d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M3 12h18M10 12v2h4v-2" />],
  settings: [<path key="1" d="M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8z" />, <path key="2" d="m4 15 1-2-1-2 2-1 .5-2.2 2.3.1 1.3-1.8 1.9 1 1.9-1 1.3 1.8 2.3-.1L19 9l2 1-1 2 1 2-2 1-.5 2.2-2.3-.1-1.3 1.8-1.9-1-1.9 1-1.3-1.8-2.3.1L7 17z" />],
  search: [<circle key="1" cx="10.5" cy="10.5" r="6.5" />, <path key="2" d="m16 16 5 5" />],
  sparkles: [<path key="1" d="m12 2 1.4 4.7L18 8l-4.6 1.3L12 14l-1.4-4.7L6 8l4.6-1.3z" />, <path key="2" d="m19 14 .8 2.2L22 17l-2.2.8L19 20l-.8-2.2L16 17l2.2-.8z" />],
  help: [<circle key="1" cx="12" cy="12" r="9" />, <path key="2" d="M9.5 9a2.5 2.5 0 1 1 4.3 1.8c-1.1 1-1.8 1.3-1.8 2.7M12 17h.01" />],
  notebook: [<path key="1" d="M6 3h12v18H6zM9 3v18" />, <path key="2" d="M3 7h3M3 12h3M3 17h3M12 7h3M12 11h4M12 15h3" />],
  map: [<path key="1" d="m3 6 6-3 6 3 6-3v15l-6 3-6-3-6 3z" />, <path key="2" d="M9 3v15M15 6v15" />],
  calendar: [<rect key="1" x="3" y="5" width="18" height="16" rx="2" />, <path key="2" d="M7 3v4M17 3v4M3 10h18M7 14h.01M11 14h.01M15 14h.01M7 18h.01M11 18h.01" />],
  graduation: [<path key="1" d="m3 9 9-5 9 5-9 5z" />, <path key="2" d="M7 11v5c2.6 2 9.4 2 12 0v-5M21 9v7" />],
  location: [<path key="1" d="M12 21s6-5.2 6-11a6 6 0 1 0-12 0c0 5.8 6 11 6 11z" />, <circle key="2" cx="12" cy="10" r="2.2" />],
  clock: [<circle key="1" cx="12" cy="12" r="8.5" />, <path key="2" d="M12 7v5l3 2" />],
  image: [<rect key="1" x="3" y="4" width="18" height="16" rx="2" />, <circle key="2" cx="8" cy="9" r="1.5" />, <path key="3" d="m4 17 5-5 4 4 2-2 5 5" />],
  download: [<path key="1" d="M12 3v12M7 10l5 5 5-5M4 20h16" />],
  save: [<path key="1" d="M5 3h11l3 3v15H5z" />, <path key="2" d="M8 3v6h7V3M8 17h8" />],
  lightbulb: [<path key="1" d="M9 18h6M10 21h4" />, <path key="2" d="M8 15.5c-1.2-1.1-2-2.6-2-4.3A6 6 0 0 1 18 11.2c0 1.7-.8 3.2-2 4.3-.7.7-1 1.2-1.2 2.5h-5.6c-.2-1.3-.5-1.8-1.2-2.5z" />],
  brain: [<path key="1" d="M9 5.5A3 3 0 0 0 4 8a3 3 0 0 0 1 5.6A3 3 0 0 0 8 19a3 3 0 0 0 4-2.5 3 3 0 0 0 4 2.5 3 3 0 0 0 3-5.4A3 3 0 0 0 20 8a3 3 0 0 0-5-2.5A3 3 0 0 0 9 5.5z" />, <path key="2" d="M12 4v16M8 9h4M12 14h4" />],
  list: [<path key="1" d="M8 6h12M8 12h12M8 18h12" />, <path key="2" d="M4 6h.01M4 12h.01M4 18h.01" />],
  pen: [<path key="1" d="m5 19 3.5-.8L19 7.7a2.1 2.1 0 0 0-3-3L5.8 15.2z" />, <path key="2" d="m14 6 4 4" />],
  bolt: [<path key="1" d="m13 2-8 12h6l-1 8 8-12h-6z" />],
  file: [<path key="1" d="M6 3h8l4 4v14H6zM14 3v5h5M9 13h6M9 17h6" />],
  "chevron-down": [<path key="1" d="m6 9 6 6 6-6" />],
  "chevron-right": [<path key="1" d="m9 6 6 6-6 6" />],
  "chevron-left": [<path key="1" d="m15 6-6 6 6 6" />],
  "arrow-right": [<path key="1" d="M4 12h16M13 6l6 6-6 6" />],
  "arrow-up-right": [<path key="1" d="M5 19 19 5M9 5h10v10" />],
  close: [<path key="1" d="m6 6 12 12M18 6 6 18" />],
  more: [<circle key="1" cx="5" cy="12" r="1.1" fill="currentColor" stroke="none" />, <circle key="2" cx="12" cy="12" r="1.1" fill="currentColor" stroke="none" />, <circle key="3" cx="19" cy="12" r="1.1" fill="currentColor" stroke="none" />],
  check: [<path key="1" d="m5 12 4 4L19 6" />],
  alert: [<path key="1" d="M12 3 2.5 20h19z" />, <path key="2" d="M12 9v5M12 17h.01" />],
  external: [<path key="1" d="M14 4h6v6M20 4l-9 9" />, <path key="2" d="M18 13v5a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2h5" />],
  lock: [<rect key="1" x="5" y="10" width="14" height="10" rx="2" />, <path key="2" d="M8 10V7a4 4 0 0 1 8 0v3" />],
  crown: [<path key="1" d="m4 7 3 3 5-6 5 6 3-3-2 12H6z" />, <path key="2" d="M7 19h10" />],
  heart: [<path key="1" d="M20 8.5c0 5-8 10-8 10s-8-5-8-10A4.5 4.5 0 0 1 12 7a4.5 4.5 0 0 1 8 1.5z" />],
  comment: [<path key="1" d="M4 5.5h16v11H9l-5 4z" />],
  share: [<circle key="1" cx="18" cy="5" r="2.3" />, <circle key="2" cx="6" cy="12" r="2.3" />, <circle key="3" cx="18" cy="19" r="2.3" />, <path key="4" d="m8 11 8-4M8 13l8 4" />],
  send: [<path key="1" d="m3 11 18-8-7 18-3.5-7z" />, <path key="2" d="M10.5 14 21 3" />],
  rotate: [<path key="1" d="M20 11a8 8 0 0 0-13.8-4L4 10M4 10V5M4 10h5M4 13a8 8 0 0 0 13.8 4L20 14M20 14v5M20 14h-5" />],
  user: [<circle key="1" cx="12" cy="8" r="3.2" />, <path key="2" d="M5 21c.5-4.2 2.7-6.2 7-6.2s6.5 2 7 6.2" />],
  folder: [<path key="1" d="M3 6h7l2 2h9v10.5A2.5 2.5 0 0 1 18.5 21h-14A2.5 2.5 0 0 1 2 18.5V6z" />],
};

export function LakshyaIcon({ name, size = 20, strokeWidth = 1.9, label }: { name: string; size?: number; strokeWidth?: number; label?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" aria-hidden={label ? undefined : true} aria-label={label}>
      {paths[name] || []}
    </svg>
  );
}
