'use client';

import {
  createContext,
  useContext,
  type ReactNode,
} from 'react';

import type { MeResponse } from '@/lib/auth';

interface DashboardAuthContextValue {
  data: MeResponse;
  logout: () => Promise<void>;
}

const DashboardAuthContext =
  createContext<DashboardAuthContextValue | null>(null);

interface DashboardAuthProviderProps {
  data: MeResponse;
  logout: () => Promise<void>;
  children: ReactNode;
}

export function DashboardAuthProvider({
  data,
  logout,
  children,
}: DashboardAuthProviderProps) {
  return (
    <DashboardAuthContext.Provider value={{ data, logout }}>
      {children}
    </DashboardAuthContext.Provider>
  );
}

export function useDashboardAuth(): DashboardAuthContextValue {
  const context = useContext(DashboardAuthContext);

  if (!context) {
    throw new Error(
      'useDashboardAuth must be used inside DashboardAuthProvider',
    );
  }

  return context;
}
