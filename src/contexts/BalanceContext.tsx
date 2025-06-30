"use client";

import React, { createContext, useContext, ReactNode } from 'react';

interface BalanceContextType {
  refreshBalance?: () => void;
  refreshHoldings?: () => void;
}

const BalanceContext = createContext<BalanceContextType>({});

export const useBalance = () => {
  return useContext(BalanceContext);
};

interface BalanceProviderProps {
  children: ReactNode;
  refreshBalance?: () => void;
  refreshHoldings?: () => void;
}

export const BalanceProvider: React.FC<BalanceProviderProps> = ({
  children,
  refreshBalance,
  refreshHoldings,
}) => {
  return (
    <BalanceContext.Provider value={{ refreshBalance, refreshHoldings }}>
      {children}
    </BalanceContext.Provider>
  );
}; 