"use client";

import { useEffect, useState, useRef, ReactNode } from "react";
import { RefreshCw } from "lucide-react";

interface PullToRefreshProps {
  onRefresh: () => Promise<void>;
  children: ReactNode;
  backgroundColor?: string;
}

export default function PullToRefresh({ onRefresh, children, backgroundColor = "bg-background" }: PullToRefreshProps) {
  const [isPulling, setIsPulling] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const startY = useRef(0);
  const currentY = useRef(0);
  const refreshThreshold = 70; 
  const initialIconOffset = 15;
  const initialTouchIdentifier = useRef<number | null>(null);
  const isAtTop = useRef(true);
  const isScrolling = useRef(false);
  
  // Reset all states and references
  const resetStates = () => {
    setPullDistance(0);
    setIsPulling(false);
    startY.current = 0;
    currentY.current = 0;
    initialTouchIdentifier.current = null;
  };

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Track scroll position
    const handleScroll = () => {
      isAtTop.current = container.scrollTop === 0;
      
      // If we're pulling and scroll away from top, cancel
      if (isPulling && !isAtTop.current) {
        resetStates();
      }
    };

    // Track if user is actively scrolling
    let scrollTimeout: NodeJS.Timeout;
    const handleScrollStart = () => {
      isScrolling.current = true;
      clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(() => {
        isScrolling.current = false;
      }, 150); // Consider scrolling stopped after 150ms of no scroll events
    };

    const handleTouchStart = (e: TouchEvent) => {
      // Don't start pull if we're scrolling or not at top
      if (isScrolling.current || !isAtTop.current || e.touches.length === 0 || isPulling || refreshing) {
        return;
      }
      
      initialTouchIdentifier.current = e.touches[0].identifier;
      startY.current = e.touches[0].clientY;
    };

    const handleTouchMove = (e: TouchEvent) => {
      // If we're scrolling, don't interfere with normal scroll
      if (isScrolling.current) {
        resetStates();
        return;
      }
      
      // Only process if we have an active touch that started at the top
      if (initialTouchIdentifier.current === null || !isAtTop.current) {
        return;
      }
      
      // Find the touch that corresponds to our initial touch
      let touchIndex = -1;
      for (let i = 0; i < e.changedTouches.length; i++) {
        if (e.changedTouches[i].identifier === initialTouchIdentifier.current) {
          touchIndex = i;
          break;
        }
      }
      
      // If touch not found, abort
      if (touchIndex === -1) {
        resetStates();
        return;
      }
      
      currentY.current = e.changedTouches[touchIndex].clientY;
      const distance = currentY.current - startY.current;
      
      // Only trigger pull if moving downward
      if (distance > 0) {
        // Now we start pulling
        setIsPulling(true);
        
        // Apply resistance and limit to exactly 70px max
        const newDistance = Math.min(refreshThreshold, distance * 0.5);
        setPullDistance(newDistance);
        
        // Prevent default only for downward pulls at the top
        e.preventDefault();
      } else {
        // Moving upward, let normal scroll take over
        resetStates();
      }
    };

    const handleTouchEnd = async (e: TouchEvent) => {
      // Check if it's our tracked touch
      let matchFound = false;
      for (let i = 0; i < e.changedTouches.length; i++) {
        if (e.changedTouches[i].identifier === initialTouchIdentifier.current) {
          matchFound = true;
          break;
        }
      }
      
      if (!matchFound || !isPulling || !isAtTop.current) {
        resetStates();
        return;
      }
      
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
            resetStates();
          }, 500);
        }
      } else {
        // Not enough pull, reset immediately
        resetStates();
      }
    };

    // Initialize isAtTop
    isAtTop.current = container.scrollTop === 0;

    container.addEventListener("scroll", handleScroll, { passive: true });
    container.addEventListener("scroll", handleScrollStart, { passive: true });
    container.addEventListener("touchstart", handleTouchStart, { passive: true });
    container.addEventListener("touchmove", handleTouchMove, { passive: false });
    container.addEventListener("touchend", handleTouchEnd);
    container.addEventListener("touchcancel", resetStates);

    return () => {
      clearTimeout(scrollTimeout);
      container.removeEventListener("scroll", handleScroll);
      container.removeEventListener("scroll", handleScrollStart);
      container.removeEventListener("touchstart", handleTouchStart);
      container.removeEventListener("touchmove", handleTouchMove);
      container.removeEventListener("touchend", handleTouchEnd);
      container.removeEventListener("touchcancel", resetStates);
    };
  }, [isPulling, refreshing, onRefresh, pullDistance]);

  // Calculate icon position based on pull distance
  const iconPosition = pullDistance > 0 || refreshing ? initialIconOffset + pullDistance : -50;

  return (
    <div className={`relative min-h-screen flex flex-col ${backgroundColor} overflow-hidden`}>
      {/* Moving refresh icon */}
      <div 
        className="absolute left-0 right-0 z-20 flex justify-center pointer-events-none transition-all duration-200"
        style={{ 
          top: `${iconPosition}px`,
          // Hide completely when not in use and not pulled
          opacity: pullDistance > 0 || refreshing ? 1 : 0
        }}
      >
        <div className="bg-green-900/30 p-3 rounded-full">
          <RefreshCw 
            className={`h-8 w-8 text-green-500 ${refreshing ? 'animate-spin' : ''}`} 
            style={{ 
              transform: refreshing ? 'rotate(0deg)' : `rotate(${-1 * (pullDistance / refreshThreshold) * 360}deg)`,
            }} 
          />
        </div>
      </div>
    
      <div 
        ref={containerRef} 
        className={`h-full overflow-y-auto flex-grow overscroll-none ${backgroundColor}`} 
        style={{ 
          overscrollBehavior: "none",
          WebkitOverflowScrolling: "touch"
        }}
      >
        {/* Pull space */}
        <div 
          className={`transition-all duration-200 ease-out ${backgroundColor}`}
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