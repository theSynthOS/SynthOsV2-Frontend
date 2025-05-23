import * as React from "react";
import { useDraggable } from "./useDraggable";
import { useTheme } from "next-themes";

interface RadialProgressBarProps {
  initialAngle: number; // 0-1 range from parent
  maxBalance: number;
  onAngleChange?: (percentage: number) => void; // Calls back with 0-100 percentage
}

export const RadialProgressBar: React.FC<RadialProgressBarProps> = ({
  initialAngle,
  maxBalance,
  onAngleChange,
}) => {
  // Keep track of the current angle internally
  const [currentAngle, setCurrentAngle] = React.useState(initialAngle);

  // Keep track of the selected percentage button
  const [selectedPercentage, setSelectedPercentage] = React.useState<number | null>(null);

  const { theme } = useTheme();

  const [draggbleRef, dx, dy, angle] = useDraggable({
    initialAngle: currentAngle,
  });

  // Call the onAngleChange callback when angle changes
  React.useEffect(() => {
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
      }
    };
    requestAnimationFrame(animate);
  };

  // Handle percentage button clicks
  const handlePercentageClick = (percentage: number) => {
    const targetAngle = percentage / 100;
    animateAngle(currentAngle, targetAngle);
    setSelectedPercentage(percentage);
    if (onAngleChange) {
      onAngleChange(percentage);
    }
  };

  // Calculate the amount based on currentAngle
  const amount = (currentAngle * maxBalance).toFixed(2);

  // Calculate angle in degrees for the conic gradient
  const angleDegrees = currentAngle * 360;

  return (
    <div className="flex flex-col items-center w-full">
      <div
        className="rounded-full overflow-hidden relative h-48 w-48 mb-4 cursor-pointer"
        style={{
          background: `conic-gradient(rgb(46, 240, 120) 0deg ${angleDegrees}deg, #e5e7eb ${angleDegrees}deg 360deg)`,
        }}
      >
        <div
          className={`rounded-full absolute inset-4 ${
            theme === "dark" ? "bg-gray-800" : "bg-white"
          }`}
        />

        <div className="absolute inset-2 flex items-center justify-center">
          <div
            className="bg-[rgb(0,105,32)] rounded-full h-4 w-4 absolute top-0 left-0 cursor-move select-none touch-none z-10"
            ref={draggbleRef}
            style={{
              transform: `translate(${dx}px, ${dy}px)`,
              transition: 'none', // Remove transition for more precise tracking
              boxShadow: '0 0 0 2px rgba(255, 255, 255, 0.8)', // Add white border for better visibility
            }}
          />
          <span className="text-xl font-bold">${amount}</span>
        </div>
      </div>

      {/* Percentage Buttons */}
      <div className="flex justify-between w-full mt-2  gap-2">
        <button
          onClick={() => handlePercentageClick(25)}
          className={`px-4 py-1 text-center font-bold rounded-lg transition-colors border
            ${
              selectedPercentage === 25
                ? "bg-green-500 text-white border-green-500"
                : "bg-green-100 text-green-700 border-green-500 hover:bg-green-200"
            }
          `}
        >
          25%
        </button>
        <button
          onClick={() => handlePercentageClick(50)}
          className={`px-4 py-1 text-center font-bold rounded-lg transition-colors border
            ${
              selectedPercentage === 50
                ? "bg-green-500 text-white border-green-500"
                : "bg-green-100 text-green-700 border-green-500 hover:bg-green-200"
            }
          `}
        >
          50%
        </button>
        <button
          onClick={() => handlePercentageClick(75)}
          className={`px-4 py-1 text-center font-bold rounded-lg transition-colors border
            ${
              selectedPercentage === 75
                ? "bg-green-500 text-white border-green-500"
                : "bg-green-100 text-green-700 border-green-500 hover:bg-green-200"
            }
          `}
        >
          75%
        </button>
        <button
          onClick={() => handlePercentageClick(100)}
          className={`px-4 py-1 text-center font-bold rounded-lg transition-colors border
            ${
              selectedPercentage === 100
                ? "bg-green-500 text-white border-green-500"
                : "bg-green-100 text-green-700 border-green-500 hover:bg-green-200"
            }
          `}
        >
          100%
        </button>
      </div>
    </div>
  );
};
