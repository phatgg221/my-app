'use client';

import React, { createContext, useContext } from 'react';
import { useVendors, UseVendorsReturn } from '@/hooks/useVendors';

const VendorContext = createContext<UseVendorsReturn | undefined>(undefined);

export interface VendorProviderProps {
  children: React.ReactNode;
  defaultPageSize?: number;
}


export function VendorProvider({ children, defaultPageSize = 5 }: VendorProviderProps) {
  const vendorsState = useVendors(defaultPageSize);

  return (
    <VendorContext.Provider value={vendorsState}>
      {children}
    </VendorContext.Provider>
  );
}


export function useVendorContext(): UseVendorsReturn {
  const context = useContext(VendorContext);
  if (!context) {
    throw new Error('useVendorContext must be used within a VendorProvider');
  }
  return context;
}
