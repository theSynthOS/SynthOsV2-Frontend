import * as React from "react";
import { useDraggable } from "./useDraggable";
import { useTheme } from "next-themes";

interface RadialProgressBarProps {
  initialAngle: number; // 0-1 range from parent
  maxBalance: number;
  onAngleChange?: (percentage: number) => void; // Calls back with 0-100 percentage
  onWheel?: (e: React.WheelEvent) => void;
  onTouchMove?: (e: React.TouchEvent) => void;
  isLoadingBalance?: boolean; // Add loading state prop
}

export const RadialProgressBar: React.FC<RadialProgressBarProps> = ({
  initialAngle,
  maxBalance,
  onAngleChange,
  onWheel,
  onTouchMove,
  isLoadingBalance = false, // Default to false
}) => {
  // Keep track of the current angle internally
  const [currentAngle, setCurrentAngle] = React.useState(initialAngle);
  
  // Keep track of whether the component was just mounted
  const isInitialMount = React.useRef(true);

  // Keep track of the selected percentage button
  const [selectedPercentage, setSelectedPercentage] = React.useState<number | null>(null);

  const { theme } = useTheme();

  // Track if we're currently processing a percentage button click
  const processingPercentageClick = React.useRef(false);

  const [draggbleRef, dx, dy, angle] = useDraggable({
    initialAngle: currentAngle,
  });

  // Update currentAngle when initialAngle changes from parent
  React.useEffect(() => {
    // Only update on non-initial renders if the change is significant
    // This prevents tiny initialAngle changes from resetting our UI
    if (isInitialMount.current) {
      isInitialMount.current = false;
    } else {
      // Only apply changes if we're not processing a button click
      if (!processingPercentageClick.current) {
        setCurrentAngle(initialAngle);
      }
    }
  }, [initialAngle, currentAngle]);

  // Call the onAngleChange callback when angle changes
  React.useEffect(() => {
    // Don't update during percentage button clicks to avoid feedback loops
    if (processingPercentageClick.current) {
      return;
    }
    
    // Handle zero angle explicitly
    if (angle === 0) {
      if (onAngleChange) {
        onAngleChange(0);
      }
      setSelectedPercentage(null);
      setCurrentAngle(0);
      return;
    }
    
    if (onAngleChange) {
      onAngleChange(angle * 100);
    }

    // Update selected percentage based on angle
    const currentPercentage = Math.round(angle * 100);
    if (
      currentPercentage === 25 ||
      currentPercentage === 50 ||
      currentPercentage === 75 ||
      currentPercentage === 100
    ) {
      setSelectedPercentage(currentPercentage);
    } else {
      setSelectedPercentage(null);
    }

    // Update currentAngle when angle changes from dragging
    setCurrentAngle(angle);
  }, [angle, onAngleChange]);

  // Animate currentAngle to target value
  const animateAngle = (from: number, to: number, duration = 650) => {
    const start = performance.now();
    const animate = (now: number) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const newAngle = from + (to - from) * progress;
      setCurrentAngle(newAngle);
      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        setCurrentAngle(to); // Ensure it ends exactly at the target
        // Animation is complete, allow angle changes again
        processingPercentageClick.current = false;
      }
    };
    requestAnimationFrame(animate);
  };

  // Handle percentage button clicks
  const handlePercentageClick = (percentage: number) => {
    // Set flag to prevent feedback loops during animation
    processingPercentageClick.current = true;
    
    const targetAngle = percentage / 100;
    animateAngle(currentAngle, targetAngle);
    setSelectedPercentage(percentage);
    
    // Call onAngleChange directly with the exact percentage
    if (onAngleChange) {
      // Make sure we're passing the exact percentage value (25, 50, 75, 100)
      onAngleChange(percentage);
    }
  };

  // Calculate the amount based on currentAngle
  const amount = currentAngle === 0 ? "0.00" : (currentAngle * maxBalance).toFixed(2);

  // Calculate angle in degrees for the conic gradient
  const angleDegrees = currentAngle * 360;

  return (
    <div 
      className="flex flex-col items-center w-full"
      onWheel={onWheel}
      onTouchMove={onTouchMove}
    >
      <div
        className="rounded-full overflow-hidden relative h-48 w-48 mb-4 cursor-pointer"
        style={{
          background: `conic-gradient(rgb(255, 214, 89) 0deg ${angleDegrees}deg, #e2e2e3 ${angleDegrees}deg 360deg)`,
        }}
      >
        <div
          className={`rounded-full absolute inset-1 ${
            theme === "dark" ? "bg-[#1A0D4A]" : "bg-white"
          }`}
        />

        <div className="absolute inset-1 flex items-center justify-center">
          <div
            className="bg-[#ffd659] rounded-full h-4 w-4 absolute top-0 left-0 cursor-move select-none touch-none z-10"
            ref={draggbleRef}
            style={{
              transform: `translate(${dx}px, ${dy}px)`,
              transition: 'none', // Remove transition for more precise tracking
              boxShadow: '0 0 0 2px rgba(255, 232, 161, 0.4)', // Add white border for better visibility
            }}
          />
          <span className="text-xl font-bold">${amount}</span>
        </div>
      </div>

      {/* Balance Display */}
      <div
        className={`text-center text-sm ${
          theme === "dark" ? "text-gray-400" : "text-gray-500"
        } mt-1 w-full mb-2`}
      >
        Balance:{" "}
        {isLoadingBalance ? (
          <span className="inline-flex items-center">
            <div className="h-5 w-5 border-2 border-gray-300 border-t-gray-700 rounded-full animate-spin"></div>
          </span>
        ) : (
          `${maxBalance.toFixed(2)} USDC`
        )}
      </div>

      {/* Percentage Buttons */}
      <div className="flex justify-between w-full mt-2 gap-2">
        <button
          onClick={() => handlePercentageClick(25)}
          className={`px-4 py-2 md:px-6 md:py-3 text-center font-bold rounded-lg transition-colors
            ${
              selectedPercentage === 25
                ? "bg-[#8266E6] text-white "
                : "dark:bg-white/5 bg-[#070219]/5 dark:text-white text-black hover:bg-[#3C229C]"
            }
          `}
        >
          25%
        </button>
        <button
          onClick={() => handlePercentageClick(50)}
          className={`px-4 py-2 md:px-6 md:py-3 text-center font-bold rounded-lg transition-colors
            ${
              selectedPercentage === 50
                ? "bg-[#8266E6] text-white "
                : "dark:bg-white/5 bg-[#070219]/5 dark:text-white text-black hover:bg-purple-200"
            }
          `}
        >
          50%
        </button>
        <button
          onClick={() => handlePercentageClick(75)}
          className={`px-4 py-2 md:px-6 md:py-3 text-center font-bold rounded-lg transition-colors
            ${
              selectedPercentage === 75
                ? "bg-[#8266E6] text-white "
                : "dark:bg-white/5 bg-[#070219]/5 dark:text-white text-black hover:bg-purple-200"
            }
          `}
        >
          75%
        </button>
        <button
          onClick={() => handlePercentageClick(100)}
          className={`px-4 py-2 md:px-6 md:py-3 text-center font-bold rounded-lg transition-colors
            ${
              selectedPercentage === 100
                ? "bg-[#8266E6] text-white "
                : "dark:bg-white/5 bg-[#070219]/5 dark:text-white text-black hover:bg-purple-200"
            }
          `}
        >
          100%
        </button>
      </div>
    </div>
  );
};
