"use client";

import { useId } from "react";

interface Props {
  /** Pixel width/height of the square SVG mark (default 36) */
  size?: number;
}

/**
 * The eduvianAI orbit-mark logomark.
 * Drop-in replacement for the Globe2-in-gradient-div pattern.
 * Uses a unique gradient ID per instance via React's useId() to avoid
 * SVG gradient collisions when multiple instances are on the same page.
 */
export function EduvianLogoMark({ size = 36 }: Props) {
  // useId returns ":r0:" – sanitise to a valid XML id (no colons/spaces)
  const raw = useId();
  const id = "eLg" + raw.replace(/[^a-zA-Z0-9]/g, "");

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 36 36"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      focusable="false"
    >
      <rect width="36" height="36" rx="10" fill={`url(#${id})`} />
      {/* Orbit ring */}
      <ellipse
        cx="18" cy="18" rx="11" ry="6"
        stroke="white" strokeWidth="1.2" strokeOpacity="0.4"
        fill="none"
        transform="rotate(-30 18 18)"
      />
      {/* Bold "e" letterform */}
      <text
        x="18" y="23"
        textAnchor="middle"
        fill="white"
        fontFamily="system-ui,sans-serif"
        fontSize="16"
        fontWeight="800"
        letterSpacing="-1"
      >
        e
      </text>
      {/* Accent dot — top-right of orbit */}
      <circle cx="26.5" cy="11.5" r="2" fill="white" fillOpacity="0.9" />
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="36" y2="36" gradientUnits="userSpaceOnUse">
          <stop stopColor="#6366F1" />
          <stop offset="1" stopColor="#A855F7" />
        </linearGradient>
      </defs>
    </svg>
  );
}
