import {
  createContext,
  useContext,
  useState,
  useCallback,
  useRef,
} from "react";

interface PointsContextType {
  refreshPoints: () => void;
  lastRefresh: number;
}

const PointsContext = createContext<PointsContextType>({
  refreshPoints: () => {},
  lastRefresh: 0,
});

export function PointsProvider({ children }: { children: React.ReactNode }) {
  const [lastRefresh, setLastRefresh] = useState(Date.now());
  const lastRefreshTimeRef = useRef(Date.now());
  const minRefreshInterval = 5000; // Minimum 5 seconds between refreshes

  const refreshPoints = useCallback(() => {
    const now = Date.now();
    // Only update if enough time has passed since last refresh
    if (now - lastRefreshTimeRef.current > minRefreshInterval) {
      lastRefreshTimeRef.current = now;
      setLastRefresh(now);
    }
  }, []);

  return (
    <PointsContext.Provider value={{ refreshPoints, lastRefresh }}>
      {children}
    </PointsContext.Provider>
  );
}

export function usePoints() {
  return useContext(PointsContext);
}
