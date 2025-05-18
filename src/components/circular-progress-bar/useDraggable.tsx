import * as React from 'react';

interface DraggableOptions {
    initialAngle: number;
}

type DraggableReturnType = [
    React.RefCallback<HTMLDivElement>,
    number,
    number,
    number
];

export const useDraggable = ({ initialAngle }: DraggableOptions): DraggableReturnType => {
    const [node, setNode] = React.useState<HTMLDivElement | undefined>(undefined);
    const [angle, setAngle] = React.useState(initialAngle);
    const [{ dx, dy }, setOffset] = React.useState({
        dx: 0,
        dy: 0,
    });

    const ref = React.useCallback((node: HTMLDivElement | null) => {
        if (node) setNode(node);
    }, []);

    React.useEffect(() => {
        if (!node) {
            return;
        }
        const width = node.getBoundingClientRect().width;
        const containerWidth = node.parentElement?.getBoundingClientRect().width || 0;
        const radius = containerWidth / 2;
        const center = radius - width / 2;
        
        // Calculate position from angle (0-1)
        const angleInRadians = initialAngle * 2 * Math.PI;
        // Start from top (subtract π/2) and calculate position
        const dx = center + radius * Math.sin(angleInRadians);
        const dy = center - radius * Math.cos(angleInRadians);
        setOffset({ dx, dy });
    }, [node, initialAngle]);

    // Helper function to calculate angle from drag position
    const calculateAngle = (x: number, y: number, center: number): number => {
        // Calculate angle from top (12 o'clock position)
        const radians = Math.atan2(x - center, center - y);
        
        // Convert to 0-2π range
        let normalizedRadians = radians;
        if (normalizedRadians < 0) {
            normalizedRadians += 2 * Math.PI;
        }
        
        // Convert to 0-1 range
        return normalizedRadians / (2 * Math.PI);
    };

    const handleMouseDown = React.useCallback((e: MouseEvent) => {
        if (!node) {
            return;
        }
        const startPos = {
            x: e.clientX - dx,
            y: e.clientY - dy,
        };

        const width = node.getBoundingClientRect().width;
        const containerWidth = node.parentElement?.getBoundingClientRect().width || 0;
        const radius = containerWidth / 2;
        const center = radius - width / 2;

        const handleMouseMove = (e: MouseEvent) => {
            let newDx = e.clientX - startPos.x;
            let newDy = e.clientY - startPos.y;

            // Ensure handle stays on circle perimeter
            const centerDistance = Math.sqrt(
                Math.pow(newDx - center, 2) + Math.pow(newDy - center, 2)
            );
            const sinValue = (newDy - center) / centerDistance;
            const cosValue = (newDx - center) / centerDistance;
            newDx = center + radius * cosValue;
            newDy = center + radius * sinValue;

            // Calculate new angle (0-1)
            const newAngle = calculateAngle(newDx, newDy, center);
            setAngle(newAngle);
            setOffset({ dx: newDx, dy: newDy });
            updateCursor();
        };

        const handleMouseUp = () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
            resetCursor();
        };

        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
    }, [node, dx, dy]);

    const handleTouchStart = React.useCallback((e: TouchEvent) => {
        if (!node) {
            return;
        }
        const touch = e.touches[0];

        const startPos = {
            x: touch.clientX - dx,
            y: touch.clientY - dy,
        };
        const width = node.getBoundingClientRect().width;
        const containerWidth = node.parentElement?.getBoundingClientRect().width || 0;
        const radius = containerWidth / 2;
        const center = radius - width / 2;

        const handleTouchMove = (e: TouchEvent) => {
            const touch = e.touches[0];
            let newDx = touch.clientX - startPos.x;
            let newDy = touch.clientY - startPos.y;
            
            // Ensure handle stays on circle perimeter
            const centerDistance = Math.sqrt(
                Math.pow(newDx - center, 2) + Math.pow(newDy - center, 2)
            );
            const sinValue = (newDy - center) / centerDistance;
            const cosValue = (newDx - center) / centerDistance;
            newDx = center + radius * cosValue;
            newDy = center + radius * sinValue;

            // Calculate new angle (0-1)
            const newAngle = calculateAngle(newDx, newDy, center);
            setAngle(newAngle);
            setOffset({ dx: newDx, dy: newDy });
            updateCursor();
        };

        const handleTouchEnd = () => {
            document.removeEventListener('touchmove', handleTouchMove);
            document.removeEventListener('touchend', handleTouchEnd);
            resetCursor();
        };

        document.addEventListener('touchmove', handleTouchMove);
        document.addEventListener('touchend', handleTouchEnd);
    }, [node, dx, dy]);

    const updateCursor = () => {
        document.body.style.cursor = 'move';
        document.body.style.userSelect = 'none';
    };

    const resetCursor = () => {
        document.body.style.removeProperty('cursor');
        document.body.style.removeProperty('user-select');
    };

    React.useEffect(() => {
        if (!node) {
            return;
        }
        
        const mouseDownHandler = (e: Event) => handleMouseDown(e as MouseEvent);
        const touchStartHandler = (e: Event) => handleTouchStart(e as TouchEvent);
        
        node.addEventListener("mousedown", mouseDownHandler);
        node.addEventListener("touchstart", touchStartHandler);
        
        return () => {
            node.removeEventListener("mousedown", mouseDownHandler);
            node.removeEventListener("touchstart", touchStartHandler);
        };
    }, [node, handleMouseDown, handleTouchStart]);

    return [ref, dx, dy, angle];
};