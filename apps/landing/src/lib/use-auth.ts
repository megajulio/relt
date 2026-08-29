'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getMe, logout as doLogout, type MeResponse } from './auth';

type AuthState =
  | { status: 'loading' }
  | { status: 'authenticated'; data: MeResponse }
  | { status: 'unauthenticated' };

export type UseAuthResult =
  | { status: 'loading'; logout: () => Promise<void> }
  | { status: 'authenticated'; data: MeResponse; logout: () => Promise<void> }
  | { status: 'unauthenticated'; logout: () => Promise<void> };

export function useAuth(redirectToLogin = true): UseAuthResult {
  const router = useRouter();
  const [state, setState] = useState<AuthState>({ status: 'loading' });

  useEffect(() => {
    let cancelled = false;

    getMe()
      .then((data) => {
        if (!cancelled) setState({ status: 'authenticated', data });
      })
      .catch(() => {
        if (!cancelled) {
          setState({ status: 'unauthenticated' });
          if (redirectToLogin) {
            router.replace('/login');
          }
        }
      });

    return () => {
      cancelled = true;
    };
  }, [router, redirectToLogin]);

  async function logout() {
    try {
      await doLogout();
    } catch {
      // ignorar errores al limpiar sesión
    }
    setState({ status: 'unauthenticated' });
    router.replace('/login');
  }

  return { ...state, logout } as UseAuthResult;
}
