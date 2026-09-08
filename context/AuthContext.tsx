'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { fetchOpsCoordinators, User } from '@/app/user.service';

export type { User };

interface AuthContextType {
  users: User[];
  currentUser: User | null;
  userId: string;
  setCurrentUser: (user: User) => void;
  isLoading: boolean;
  refreshUsers: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [users, setUsers] = useState<User[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const fetchUsers = useCallback(async () => {
    try {
      const data = await fetchOpsCoordinators();
      setUsers(data);
      if (data.length > 0) {
        const savedUserId = typeof window !== 'undefined' ? localStorage.getItem('selected_coordinator_id') : null;
        const matched = data.find((u) => u.id === savedUserId);
        setCurrentUser(matched || data[0]);
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      console.error('Failed to load Ops Coordinators:', message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    let ignore = false;

    fetchOpsCoordinators()
      .then((data) => {
        if (!ignore) {
          setUsers(data);
          if (data.length > 0) {
            const savedUserId = typeof window !== 'undefined' ? localStorage.getItem('selected_coordinator_id') : null;
            const matched = data.find((u) => u.id === savedUserId);
            setCurrentUser(matched || data[0]);
          }
        }
      })
      .catch((error: unknown) => {
        const message = error instanceof Error ? error.message : 'Unknown error';
        console.error('Failed to load Ops Coordinators:', message);
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

  const handleSetCurrentUser = (user: User) => {
    setCurrentUser(user);
    if (typeof window !== 'undefined') {
      localStorage.setItem('selected_coordinator_id', user.id);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        users,
        currentUser,
        userId: currentUser?.id || '',
        setCurrentUser: handleSetCurrentUser,
        isLoading,
        refreshUsers: fetchUsers,
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
