import { ReactNode } from "react";
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
    {
      theme === "dark" && (
        <div
          className="fixed -top-24 -left-24 w-96 h-96 rounded-full opacity-[50%] z-10 overflow-hidden"
          style={{
            background: "#3C229C80",
            filter: "blur(40px)",
            backdropFilter: "blur(228px)",
          }}
        />
      );
    }
  }

  // For light theme, use the BackgroundGradientAnimation component
  return (
    <BackgroundGradientAnimation className={className}>
      {children}
    </BackgroundGradientAnimation>
  );
}
