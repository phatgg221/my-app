'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { getMe, logout, fetchOpsCoordinators, mockLogin, User } from '@/app/user.service';

export type { User };

interface AuthContextType {
  currentUser: User | null;
  userId: string;
  isAuthenticated: boolean;
  isGoogleConfigured: boolean;
  isLoading: boolean;
  authError: string | null;
  coordinators: User[];
  selectCoordinator: (userId: string) => Promise<void>;
  loginWithRealGoogle: () => void;
  signOut: () => Promise<void>;
  clearAuthError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [coordinators, setCoordinators] = useState<User[]>([]);
  const [isGoogleConfigured, setIsGoogleConfigured] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [authError, setAuthError] = useState<string | null>(null);

  useEffect(() => {
    let ignore = false;

    // Concurrently fetch active session and all mock coordinators
    Promise.all([getMe(), fetchOpsCoordinators()])
      .then(async ([session, coords]) => {
        if (ignore) return;
        setIsGoogleConfigured(session.isGoogleConfigured);
        setCoordinators(coords);

        if (session.user) {
          setCurrentUser(session.user);
        } else {
          // If no session exists and user has not explicitly signed out, auto-select first coordinator
          const explicitlySignedOut = typeof window !== 'undefined' && sessionStorage.getItem('shopee_explicit_signed_out') === 'true';
          if (!explicitlySignedOut && coords.length > 0) {
            try {
              const defaultUser = await mockLogin(coords[0].id);
              if (!ignore) {
                setCurrentUser(defaultUser);
              }
            } catch {
              // fallback to guest if mock login failed
            }
          }
        }

        // Check URL parameters for OAuth redirect status / errors
        if (typeof window !== 'undefined') {
          const searchParams = new URLSearchParams(window.location.search);
          const err = searchParams.get('auth_error');
          if (err) {
            if (err === 'missing_credentials') {
              setAuthError('Google OAuth is not configured yet. Please input your GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in .env.local.');
            } else {
              setAuthError(`Google Sign-In failed: ${decodeURIComponent(err)}`);
            }
            window.history.replaceState({}, '', window.location.pathname);
          } else if (searchParams.get('auth_success')) {
            window.history.replaceState({}, '', window.location.pathname);
          }
        }
      })
      .catch((error: unknown) => {
        const message = error instanceof Error ? error.message : 'Unknown error';
        console.error('Error initializing auth state:', message);
      })
      .finally(() => {
        if (!ignore) {
          setIsLoading(false);
        }
      });

    return () => {
      ignore = true;
    };
  }, []);

  const selectCoordinator = useCallback(async (selectedUserId: string) => {
    try {
      setIsLoading(true);
      if (typeof window !== 'undefined') {
        sessionStorage.removeItem('shopee_explicit_signed_out');
      }
      const user = await mockLogin(selectedUserId);
      setCurrentUser(user);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to switch coordinator';
      setAuthError(message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const loginWithRealGoogle = () => {
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem('shopee_explicit_signed_out');
      // eslint-disable-next-line @next/next/no-location-assign-relative-destination
      window.location.assign('/api/auth/google/login');
    }
  };

  const signOut = async () => {
    try {
      if (typeof window !== 'undefined') {
        sessionStorage.setItem('shopee_explicit_signed_out', 'true');
      }
      await logout();
    } catch {
      // ignore
    }
    setCurrentUser(null);
  };

  const clearAuthError = () => setAuthError(null);

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        userId: currentUser?.id || '',
        isAuthenticated: Boolean(currentUser),
        isGoogleConfigured,
        isLoading,
        authError,
        coordinators,
        selectCoordinator,
        loginWithRealGoogle,
        signOut,
        clearAuthError,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
