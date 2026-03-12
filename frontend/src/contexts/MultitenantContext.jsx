import React, { createContext, useContext } from 'react';
import { useMtAuth } from '../hooks/useMtApi';

const MultitenantContext = createContext(null);

export function MultitenantProvider({ children }) {
  const auth = useMtAuth();
  return (
    <MultitenantContext.Provider value={auth}>
      {children}
    </MultitenantContext.Provider>
  );
}

export function useMultitenant() {
  return useContext(MultitenantContext);
}
