"use client";

import React, { createContext, useContext, ReactNode } from 'react';

interface BalanceContextType {
  refreshBalance?: () => void;
}

const BalanceContext = createContext<BalanceContextType>({});

export const useBalance = () => {
  return useContext(BalanceContext);
};

interface BalanceProviderProps {
  children: ReactNode;
  refreshBalance?: () => void;
}

export const BalanceProvider: React.FC<BalanceProviderProps> = ({
  children,
  refreshBalance,
}) => {
  return (
    <BalanceContext.Provider value={{ refreshBalance }}>
      {children}
    </BalanceContext.Provider>
  );
}; 