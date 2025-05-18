import * as React from 'react';
import { useDraggable } from './useDraggable';

interface RadialProgressBarProps {
    initialAngle: number;
    maxBalance: number;
    onAngleChange?: (angle: number) => void;
}

export const RadialProgressBar: React.FC<RadialProgressBarProps> = ({ 
    initialAngle, 
    maxBalance,
    onAngleChange 
}) => {
    const [draggbleRef, dx, dy, angle] = useDraggable({
        initialAngle,
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
            className="radial-progress-bar"
            style={{
                background: `conic-gradient(#4ADE80 0deg ${angleDegrees}deg, #e5e7eb ${angleDegrees}deg 360deg)`
            }}
        >
            <div className="radial-progress-bar__overlay" />

            <div className="radial-progress-bar__circle">
                <div
                    className="draggable"
                    ref={draggbleRef}
                    style={{
                        transform: `translate(${dx}px, ${dy}px)`,
                        zIndex: 9999,
                    }}
                />
                <span className="text-xl font-bold">${amount}</span>
            </div>
        </div>
    );
};