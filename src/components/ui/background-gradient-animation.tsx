"use client";
import { cn } from "@/lib/utils";
import { useEffect, useState, useMemo } from "react";

export const BackgroundGradientAnimation = ({
  firstColor = "143, 99, 233", // #8F63E9 - purple
  secondColor = "255, 185, 36", // #FFB924 - yellow
  size = "100%",
  children,
  className,
  containerClassName,
}: {
  firstColor?: string;
  secondColor?: string;
  size?: string;
  children?: React.ReactNode;
  className?: string;
  interactive?: boolean;
  containerClassName?: string;
}) => {
  const [isSafari, setIsSafari] = useState(false);
  const [isFirefox, setIsFirefox] = useState(false);

  // Memoize the CSS properties to prevent unnecessary updates
  const cssProperties = useMemo(
    () => ({
      "--first-color": firstColor,
      "--second-color": secondColor,
      "--size": size,
    }),
    [firstColor, secondColor, size]
  );

  useEffect(() => {
    // Only update if the values have actually changed
    Object.entries(cssProperties).forEach(([key, value]) => {
      document.body.style.setProperty(key, value);
    });
  }, [cssProperties]);

  useEffect(() => {
    setIsSafari(/^((?!chrome|android).)*safari/i.test(navigator.userAgent));
  }, []);

  useEffect(() => {
    setIsFirefox(/firefox/i.test(navigator.userAgent));
  }, []);

  return (
    <div
      className={cn(
        "min-h-screen w-full relative overflow-hidden bg-[#F0EEF9]",
        containerClassName
      )}
    >
      <div className={cn("relative z-10", className)}>{children}</div>

      {/* Blur filter for soft edges */}
      <svg className="hidden">
        <defs>
          <filter id="gooey-blur">
            <feGaussianBlur
              in="SourceGraphic"
              stdDeviation="40"
              result="blur"
            />
          </filter>
        </defs>
      </svg>

      <div
        className="absolute inset-0 overflow-hidden"
        style={{ filter: isSafari || isFirefox ? "blur(60px)" : "url(#gooey-blur)" }}
      >
        {/* Purple ball - bottom left */}
        <div
          className="absolute w-[100%] h-[100%] bottom-[-40%] right-[40%] animate-fourth"
          style={{
            background:
              "radial-gradient(circle at center, rgba(143, 99, 233, 0.8) 0%, rgba(143, 99, 233, 0) 70%)",
            opacity: 0.6,
          }}
        />

        {/* Yellow ball - top right */}
        <div
          className="absolute w-[100%] h-[100%] top-[-50%] right-[-50%] animate-second"
          style={{
            background:
              "radial-gradient(circle at center, rgba(255, 185, 36, 0.8) 0%, rgba(255, 185, 36, 0) 70%)",
            opacity: 0.6,
          }}
        />
      </div>
    </div>
  );
};
