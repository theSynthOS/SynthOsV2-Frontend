import { ReactNode } from "react";
import { useTheme } from "next-themes";
import { BackgroundGradientAnimation } from "./background-gradient-animation";

interface ThemeBackgroundProps {
  children: ReactNode;
  className?: string;
}

export function ThemeBackground({ children, className = "" }: ThemeBackgroundProps) {
  const { theme } = useTheme();
  
  // For dark theme, use a simple gradient
  if (theme === "dark") {
    return (
      <div
        className={`${className}`}
        style={{
          background: "linear-gradient(to left, #3C229C66, #0B042466), #0B0424"
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