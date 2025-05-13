"use client";

import { useEffect, useState, useRef, ReactNode } from "react";
import { RefreshCw } from "lucide-react";

interface PullToRefreshProps {
  onRefresh: () => Promise<void>;
  children: ReactNode;
}

export default function PullToRefresh({ onRefresh, children }: PullToRefreshProps) {
  const [isPulling, setIsPulling] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const startY = useRef(0);
  const currentY = useRef(0);
  const refreshThreshold = 70; 
  const initialIconOffset = 15; 
  
  // Reset all states and references
  const resetStates = () => {
    setPullDistance(0);
    setIsPulling(false);
    startY.current = 0;
    currentY.current = 0;
  };

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleTouchStart = (e: TouchEvent) => {
      // Only activate if at top of scroll with a small tolerance
      if (container.scrollTop <= 5) {
        startY.current = e.touches[0].clientY;
        setIsPulling(true);
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!isPulling) return;
      
      currentY.current = e.touches[0].clientY;
      const distance = Math.max(0, currentY.current - startY.current);
      
      // Only handle pull gestures when at the top
      if (container.scrollTop <= 5) {
        // Apply resistance - the further you pull, the harder it gets
        const newDistance = Math.min(refreshThreshold * 1.5, distance * 0.5);
        setPullDistance(newDistance);
        
        // Prevent normal scroll if pulling down
        if (distance > 0) {
          e.preventDefault();
        }
      } else {
        // If scrolled away from top, cancel pulling state
        resetStates();
      }
    };

    const handleTouchEnd = async () => {
      if (!isPulling) return;
      
      if (pullDistance >= refreshThreshold) {
        // Trigger refresh
        setRefreshing(true);
        setPullDistance(refreshThreshold); // Keep indicator visible
        
        try {
          await onRefresh();
        } catch (error) {
          console.error("Refresh failed:", error);
        } finally {
          // Reset after refresh with a delay
          setTimeout(() => {
            setPullDistance(0);
            setRefreshing(false);
          }, 500);
          
          // Complete reset
          resetStates();
        }
      } else {
        // Not enough pull, reset immediately
        resetStates();
      }
    };
    
    // Also handle scroll events to reset pulling state if user scrolls while pulling
    const handleScroll = () => {
      if (container.scrollTop > 5 && isPulling) {
        resetStates();
      }
    };

    container.addEventListener("touchstart", handleTouchStart, { passive: true });
    container.addEventListener("touchmove", handleTouchMove, { passive: false });
    container.addEventListener("touchend", handleTouchEnd);
    container.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      container.removeEventListener("touchstart", handleTouchStart);
      container.removeEventListener("touchmove", handleTouchMove);
      container.removeEventListener("touchend", handleTouchEnd);
      container.removeEventListener("scroll", handleScroll);
    };
  }, [isPulling, onRefresh, pullDistance]);

  // Calculate icon position based on pull distance
  const iconPosition = pullDistance > 0 || refreshing ? initialIconOffset + pullDistance : -50;

  return (
    <div className="relative min-h-screen flex flex-col">
      {/* Moving refresh icon */}
      <div 
        className="absolute left-0 right-0 z-20 flex justify-center pointer-events-none transition-all duration-200"
        style={{ 
          top: `${iconPosition}px`,
          // Hide completely when not in use and not pulled
          opacity: pullDistance > 0 || refreshing ? 1 : 0
        }}
      >
        <div className="bg-purple-900/30 p-3 rounded-full">
          <RefreshCw 
            className={`h-8 w-8 text-purple-500 ${refreshing ? 'animate-spin' : ''}`} 
            style={{ 
              transform: refreshing ? 'rotate(0deg)' : `rotate(${-1 * (pullDistance / refreshThreshold) * 360}deg)`,
            }} 
          />
        </div>
      </div>
    
      <div 
        ref={containerRef} 
        className="h-full overflow-y-auto flex-grow overscroll-none" 
        style={{ 
          overscrollBehavior: "none",
          WebkitOverflowScrolling: "touch"
        }}
      >
        {/* Pull space */}
        <div 
          className="transition-all duration-200 ease-out"
          style={{ 
            height: `${pullDistance}px`,
          }}
        ></div>
        
        {/* Content */}
        {children}
      </div>
    </div>
  );
} 