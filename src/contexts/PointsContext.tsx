import { createContext, useContext, useState, useCallback } from "react";

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

  const refreshPoints = useCallback(() => {
    setLastRefresh(Date.now());
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
