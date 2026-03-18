"use client";

/**
 * AniPottsHeader — shared branding component for anipotts sites.
 *
 * Drop this file into any Next.js project. Self-loads JetBrains Mono,
 * needs zero external config. Keep identical across all sites.
 *
 * @version 1.0.0
 */

import { useEffect, useState } from "react";

interface AniPottsHeaderProps {
  /** Where to pin: "top-center" (default), "top-left", "top-right" */
  position?: "top-center" | "top-left" | "top-right";
  /** "light" = dark text for light bgs, "dark" = light text for dark bgs */
  variant?: "light" | "dark";
  /** Set true to use position:fixed (survives scroll). Default false (absolute). */
  fixed?: boolean;
  /** Z-index. Default 50. */
  z?: number;
}

const FONT_URL =
  "https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400&display=swap";

const HOVER_COLOR = "#61abea";

const REST_COLORS = {
  light: "rgba(0, 0, 0, 0.35)",
  dark: "rgba(255, 255, 255, 0.4)",
};

const HOVER_SHADOW = {
  light: "0 0 6px rgba(255,255,255,0.5), 0 0 2px rgba(255,255,255,0.3)",
  dark: "0 0 6px rgba(0,0,0,0.4), 0 0 2px rgba(255,255,255,0.1)",
};

export default function AniPottsHeader({
  position = "top-center",
  variant = "dark",
  fixed = false,
  z = 50,
}: AniPottsHeaderProps) {
  const [fontLoaded, setFontLoaded] = useState(false);

  useEffect(() => {
    if (!document.querySelector(`link[href="${FONT_URL}"]`)) {
      const link = document.createElement("link");
      link.rel = "stylesheet";
      link.href = FONT_URL;
      document.head.appendChild(link);
    }
    document.fonts.ready.then(() => setFontLoaded(true));
  }, []);

  const positionClasses = {
    "top-center": "top-8 left-0 right-0 text-center",
    "top-left": "top-8 left-6",
    "top-right": "top-8 right-6",
  }[position];

  const restColor = REST_COLORS[variant];
  const hoverShadow = HOVER_SHADOW[variant];

  return (
    <header
      className={`${fixed ? "fixed" : "absolute"} ${positionClasses}`}
      style={{ zIndex: z }}
    >
      <a
        href="https://instagram.com/anipottsbuilds"
        target="_blank"
        rel="noopener noreferrer"
        style={{
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: "0.875rem",
          lineHeight: "1.25rem",
          color: restColor,
          textDecoration: "none",
          transition: "color 150ms ease, text-shadow 150ms ease",
          visibility: fontLoaded ? "visible" : "hidden",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.color = HOVER_COLOR;
          e.currentTarget.style.textShadow = hoverShadow;
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.color = restColor;
          e.currentTarget.style.textShadow = "none";
        }}
      >
        ani potts
      </a>
    </header>
  );
}
