import React from "react";
const paths = {
  image: "M3 3h18v18H3zM3 17l6-6 4 4 3-3 5 5M14 7h.01",
  video: "M3 5h12v14H3zM15 10l6-4v12l-6-4",
  json: "M8 3H6v6l-3 3 3 3v6h2M16 3h2v6l3 3-3 3v6h-2",
  emoji: "M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18M8 9h.01M16 9h.01M8 14c1 4 7 4 8 0",
  clipboard: "M9 5H6a2 2 0 0 0-2 2v13h16V7a2 2 0 0 0-2-2h-3M9 3h6v4H9zM8 12h8M8 16h5",
  grid: "M3 3h7v7H3zM14 3h7v7h-7zM3 14h7v7H3zM14 14h7v7h-7z",
  list: "M8 5h13M8 12h13M8 19h13M3 5h.01M3 12h.01M3 19h.01",
  pin: "m9 3 6 0-1 6 4 4v2H6v-2l4-4-1-6M12 15v6",
  folder: "M3 7V5a1 1 0 0 1 1-1h5l2 3h9a1 1 0 0 1 1 1v11H3V7Z",
  settings: "M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8M12 2v3M12 19v3M2 12h3M19 12h3M5 5l2 2M17 17l2 2M5 19l2-2M17 7l2-2",
  search: "M10.5 3a7.5 7.5 0 1 0 0 15 7.5 7.5 0 0 0 0-15M16 16l5 5",
  close: "m6 6 12 12M6 18 18 6",
  sun: "M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8M12 2v2M12 20v2M2 12h2M20 12h2M5 5l1 1M18 18l1 1M5 19l1-1M18 6l1-1",
  moon: "M20.9 13A9 9 0 0 1 11 3.1 9 9 0 1 0 20.9 13Z",
  monitor: "M3 3h18v13H3zM12 16v5M8 21h8",
  pause: "M8 5v14M16 5v14", play: "m7 4 14 8-14 8V4Z",
  trash: "M3 6h18M9 6V3h6v3M5 6l1 15h12l1-15M10 10v7M14 10v7",
  code: "m8 6-6 6 6 6M16 6l6 6-6 6M14 3l-4 18",
  text: "M4 5h16M12 5v15M8 20h8",
  url: "M10 13a5 5 0 0 0 7 0l3-3a5 5 0 0 0-7-7l-2 2M14 11a5 5 0 0 0-7 0l-3 3a5 5 0 0 0 7 7l2-2",
  color: "m12 3 7 9a8 8 0 1 1-14 0l7-9ZM8 16a4 4 0 0 0 4 4",
  copy: "M9 9h12v12H9zM15 5V3H3v12h2", check: "m5 12 4 4L19 6",
  expand: "M14 3h7v7M21 3l-8 8M10 21H3v-7M3 21l8-8",
  arrow: "M5 12h14m-5-5 5 5-5 5", plus: "M12 5v14M5 12h14",
  shield: "m12 3 9 4v6c0 5-9 9-9 9s-9-4-9-9V7l9-4Zm-4 9 3 3 5-6",
  clock: "M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18M12 7v5l3 2",
  spark: "m12 3 2.5 6.5L21 12l-6.5 2.5L12 21l-2.5-6.5L3 12l6.5-2.5L12 3Z",
} as const;
export type IconName = keyof typeof paths;
export function Icon({ name, size = 18, ...props }: React.SVGProps<SVGSVGElement> & { name: IconName; size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.65" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}><path d={paths[name]} /></svg>;
}
