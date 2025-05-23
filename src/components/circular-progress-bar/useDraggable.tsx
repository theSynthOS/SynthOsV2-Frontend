import * as React from "react";

interface DraggableOptions {
  initialAngle: number;
}

type DraggableReturnType = [
  React.RefCallback<HTMLDivElement>,
  number,
  number,
  number
];

export const useDraggable = ({
  initialAngle,
}: DraggableOptions): DraggableReturnType => {
  const [node, setNode] = React.useState<HTMLDivElement | undefined>(undefined);
  const [angle, setAngle] = React.useState(initialAngle);
  const [{ dx, dy }, setOffset] = React.useState({
    dx: 0,
    dy: 0,
  });

  const ref = React.useCallback((node: HTMLDivElement | null) => {
    if (node) setNode(node);
  }, []);

  // Update position when initialAngle changes
  React.useEffect(() => {
    if (!node) return;

    const width = node.getBoundingClientRect().width;
      const containerWidth =
        node.parentElement?.getBoundingClientRect().width || 0;
      const radius = containerWidth / 2;
      const center = radius - width / 2;

    // Calculate position from angle (0-1)
    const angleInRadians = initialAngle * 2 * Math.PI;
    const dx = center + radius * Math.sin(angleInRadians);
    const dy = center - radius * Math.cos(angleInRadians);
    setOffset({ dx, dy });
  }, [node, initialAngle]);

  // Helper function to calculate angle from coordinates
  const calculateAngle = (x: number, y: number, center: number): number => {
    const radians = Math.atan2(x - center, center - y);
    let normalizedRadians = radians;
    if (normalizedRadians < 0) {
      normalizedRadians += 2 * Math.PI;
    }
    return normalizedRadians / (2 * Math.PI);
  };

  const handleMouseDown = React.useCallback(
    (e: MouseEvent) => {
      if (!node) return;
      e.preventDefault();

      const width = node.getBoundingClientRect().width;
      const containerWidth =
        node.parentElement?.getBoundingClientRect().width || 0;
      const radius = containerWidth / 2;
      const center = radius - width / 2;

      const handleMouseMove = (e: MouseEvent) => {
        e.preventDefault();
        
        // Get mouse position relative to container
        const rect = node.parentElement?.getBoundingClientRect();
        if (!rect) return;
        
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        // Calculate new angle
        const newAngle = calculateAngle(x, y, center);
        setAngle(newAngle);
        
        // Calculate new position
        const angleInRadians = newAngle * 2 * Math.PI;
        const newDx = center + radius * Math.sin(angleInRadians);
        const newDy = center - radius * Math.cos(angleInRadians);
        setOffset({ dx: newDx, dy: newDy });
      };

      const handleMouseUp = () => {
        document.removeEventListener("mousemove", handleMouseMove);
        document.removeEventListener("mouseup", handleMouseUp);
      };

      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
    },
    [node]
  );

  const handleTouchStart = React.useCallback(
    (e: TouchEvent) => {
      if (!node) return;
      e.preventDefault();

      const width = node.getBoundingClientRect().width;
      const containerWidth =
        node.parentElement?.getBoundingClientRect().width || 0;
      const radius = containerWidth / 2;
      const center = radius - width / 2;

      const handleTouchMove = (e: TouchEvent) => {
        e.preventDefault();
        const touch = e.touches[0];
        
        // Get touch position relative to container
        const rect = node.parentElement?.getBoundingClientRect();
        if (!rect) return;
        
        const x = touch.clientX - rect.left;
        const y = touch.clientY - rect.top;
        
        // Calculate new angle
        const newAngle = calculateAngle(x, y, center);
        setAngle(newAngle);
        
        // Calculate new position
        const angleInRadians = newAngle * 2 * Math.PI;
        const newDx = center + radius * Math.sin(angleInRadians);
        const newDy = center - radius * Math.cos(angleInRadians);
        setOffset({ dx: newDx, dy: newDy });
      };

      const handleTouchEnd = () => {
        document.removeEventListener("touchmove", handleTouchMove);
        document.removeEventListener("touchend", handleTouchEnd);
      };

      document.addEventListener("touchmove", handleTouchMove, { passive: false });
      document.addEventListener("touchend", handleTouchEnd);
    },
    [node]
  );

  React.useEffect(() => {
    if (!node) return;

    // Add event listeners to the parent element (the circle) instead of the handle
    const parentElement = node.parentElement;
    if (parentElement) {
      parentElement.addEventListener("mousedown", handleMouseDown);
      parentElement.addEventListener("touchstart", handleTouchStart, { passive: false });

      return () => {
        parentElement.removeEventListener("mousedown", handleMouseDown);
        parentElement.removeEventListener("touchstart", handleTouchStart);
      };
    }
  }, [node, handleMouseDown, handleTouchStart]);

  return [ref, dx, dy, angle];
};
