import * as React from 'react';
import { useDraggable } from './useDraggable';
import { useTheme } from "next-themes"

interface RadialProgressBarProps {
    initialAngle: number; // 0-1 range from parent
    maxBalance: number;
    onAngleChange?: (percentage: number) => void; // Calls back with 0-100 percentage
}

export const RadialProgressBar: React.FC<RadialProgressBarProps> = ({ 
    initialAngle, 
    maxBalance,
    onAngleChange 
}) => {
    // Keep track of the current angle internally
    const [currentAngle, setCurrentAngle] = React.useState(initialAngle);
    
    // Keep track of the selected percentage button
    const [selectedPercentage, setSelectedPercentage] = React.useState<number | null>(null);
    
    const { theme } = useTheme()

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
        if (currentPercentage === 25 || currentPercentage === 50 || 
            currentPercentage === 75 || currentPercentage === 100) {
            setSelectedPercentage(currentPercentage);
        } else {
            setSelectedPercentage(null);
        }
    }, [angle, onAngleChange]);

    // Handle percentage button clicks
    const handlePercentageClick = (percentage: number) => {
        // Convert percentage to angle (0-1 range)
        const newAngle = percentage / 100;
        // Update internal state
        setCurrentAngle(newAngle);
        // Mark this percentage as selected
        setSelectedPercentage(percentage);
        // Notify parent component
        if (onAngleChange) {
            onAngleChange(percentage);
        }
    };

    // Calculate the amount based on angle (0-1) and maxBalance
    const amount = (angle * maxBalance).toFixed(2);
    
    // Calculate angle in degrees for the conic gradient
    const angleDegrees = angle * 360;

    return (
        <div className="flex flex-col items-center w-full">
            <div 
                className="rounded-full overflow-hidden relative h-48 w-48 mb-4"
                style={{
                    background: `conic-gradient(rgb(46, 240, 120) 0deg ${angleDegrees}deg, #e5e7eb ${angleDegrees}deg 360deg)`
                }}
            >
                <div className={`rounded-full absolute inset-4 ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'}`} />

                <div className="absolute inset-2 flex items-center justify-center">
                    <div
                        className="bg-[rgb(0,105,32)] rounded-full h-4 w-4 absolute top-0 left-0 cursor-move select-none touch-none"
                        ref={draggbleRef}
                        style={{
                            transform: `translate(${dx}px, ${dy}px)`,
                        }}
                    />
                    <span className="text-xl font-bold">${amount}</span>
                </div>
            </div>
            
            {/* Percentage Buttons */}
            <div className="flex justify-between w-full mt-2 px-4">
                <button 
                    onClick={() => handlePercentageClick(25)}
                    className={`${
                        selectedPercentage === 25 
                            ? 'text-green-500 font-bold' 
                            : `${theme === 'dark' ? 'text-white' : 'text-gray-600'}`
                    } px-4 py-1 text-center transition-colors`}
                >
                    25%
                </button>
                <button 
                    onClick={() => handlePercentageClick(50)}
                    className={`${
                        selectedPercentage === 50 
                            ? 'text-green-500 font-bold' 
                            : `${theme === 'dark' ? 'text-white' : 'text-gray-600'}`
                    } px-4 py-1 text-center transition-colors`}
                >
                    50%
                </button>
                <button 
                    onClick={() => handlePercentageClick(75)}
                    className={`${
                        selectedPercentage === 75 
                            ? 'text-green-500 font-bold' 
                            : `${theme === 'dark' ? 'text-white' : 'text-gray-600'}`
                    } px-4 py-1 text-center transition-colors`}
                >
                    75%
                </button>
                <button 
                    onClick={() => handlePercentageClick(100)}
                    className={`${
                        selectedPercentage === 100 
                            ? 'text-green-500 font-bold' 
                            : `${theme === 'dark' ? 'text-white' : 'text-gray-600'}`
                    } px-4 py-1 text-center transition-colors`}
                >
                    100%
                </button>
            </div>
        </div>
    );
};