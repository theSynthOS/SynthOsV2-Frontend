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

  // For dark theme, use a simple gradient
  if (theme === "dark") {
    return (
      <div
        className={`${className}`}
        style={{
          background:
            "linear-gradient( to bottom left, #0C0C0C66, #0C0C0C66), #0C0C0C",
        }}
      >
        {children}
      </div>
    );
  }

  // For light theme, use the BackgroundGradientAnimation component
  return (
    <BackgroundGradientAnimation className={className}>
      {children}
    </BackgroundGradientAnimation>
  );
}
