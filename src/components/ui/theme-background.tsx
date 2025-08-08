"use client";

import { ReactNode, useState, useEffect } from "react";
import { useTheme } from "next-themes";
import { BackgroundGradientAnimation } from "./background-gradient-animation";

interface ThemeBackgroundProps {
  children: ReactNode;
  className?: string;
}

export function ThemeBackground({
  children,
  className = "",
}: ThemeBackgroundProps) {
  const { theme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Prevent hydration mismatch by only rendering theme-specific content after mounting
  useEffect(() => {
    setMounted(true);
  }, []);

  // During SSR and before mounting, render a neutral background
  if (!mounted) {
    return <div className={`${className} min-h-screen`}>{children}</div>;
  }

  return (
    <div className={`${className} min-h-screen relative`}>
      {/* Dark theme background - always present but conditionally visible */}
      <div
        className={`absolute inset-0 transition-opacity duration-300 ${
          theme === "dark" ? "opacity-100" : "opacity-0"
        }`}
        style={{
          background:
            "linear-gradient( to bottom left, #0C0C0C66, #0C0C0C66), #0C0C0C",
        }}
      />

      {/* Light theme background - always present but conditionally visible */}
      <div
        className={`absolute inset-0 transition-opacity duration-300 ${
          theme === "light" ? "opacity-100" : "opacity-0"
        }`}
      >
        <BackgroundGradientAnimation className="h-full" />
      </div>

      {/* Content - always on top */}
      <div className="relative z-10 h-full">{children}</div>
    </div>
  );
}
