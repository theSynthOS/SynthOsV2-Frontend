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
    
    const { theme } = useTheme()

    const [draggbleRef, dx, dy, angle] = useDraggable({
        initialAngle: currentAngle,
    });

    // Call the onAngleChange callback when angle changes
    React.useEffect(() => {
        if (onAngleChange) {
            onAngleChange(angle * 100);
        }
    }, [angle, onAngleChange]);

    // Calculate the amount based on angle (0-1) and maxBalance
    const amount = (angle * maxBalance).toFixed(2);
    
    // Calculate angle in degrees for the conic gradient
    const angleDegrees = angle * 360;

    return (
        <div 
            className="rounded-full overflow-hidden relative h-48 w-48"
            style={{
                background: `conic-gradient(rgb(46, 240, 120) 0deg ${angleDegrees}deg, #e5e7eb ${angleDegrees}deg 360deg)`
            }}
        >
            <div className={`rounded-full  absolute inset-4 ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'}`} />

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
    );
};