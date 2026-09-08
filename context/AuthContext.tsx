'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { getMe, logout, User } from '@/app/user.service';

export type { User };

interface AuthContextType {
  currentUser: User | null;
  userId: string;
  isAuthenticated: boolean;
  isGoogleConfigured: boolean;
  isLoading: boolean;
  authError: string | null;
  loginWithRealGoogle: () => void;
  signOut: () => Promise<void>;
  clearAuthError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isGoogleConfigured, setIsGoogleConfigured] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [authError, setAuthError] = useState<string | null>(null);

  useEffect(() => {
    let ignore = false;

    // Fetch active server session
    getMe()
      .then((session) => {
        if (ignore) return;
        setIsGoogleConfigured(session.isGoogleConfigured);
        setCurrentUser(session.user);

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
        console.error('Error loading user session:', message);
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

  const loginWithRealGoogle = () => {
    if (typeof window !== 'undefined') {
      // eslint-disable-next-line @next/next/no-location-assign-relative-destination
      window.location.assign('/api/auth/google/login');
    }
  };

  const signOut = async () => {
    try {
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
