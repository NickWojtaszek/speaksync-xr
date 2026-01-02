import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { useLocalStorage } from '../hooks/useLocalStorage';
import type { User, UserRole, AuthData, AuthContextType } from '../types/auth';
import { INITIAL_STAFF } from '../types/auth';

const PINAuthContext = createContext<AuthContextType | undefined>(undefined);

const STORAGE_KEY = 'speaksync_pin_auth';

export const PINAuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [authData, setAuthData] = useLocalStorage<AuthData>(STORAGE_KEY, {
    users: INITIAL_STAFF,
    currentUser: null,
  });
  const [loading, setLoading] = useState(true);

  // Restore session on mount
  useEffect(() => {
    setLoading(false);
  }, []);

  /**
   * Validate PIN for a user
   */
  const validatePin = useCallback((userId: string, pin: string): boolean => {
    const user = authData.users.find(u => u.id === userId);
    if (!user) return false;

    // If user has no PIN configured, any login is valid
    if (!user.pin) return true;

    // Otherwise, PIN must match exactly
    return user.pin === pin;
  }, [authData.users]);

  /**
   * Login a user (after PIN validation if required)
   */
  const login = useCallback((userId: string): boolean => {
    const user = authData.users.find(u => u.id === userId);
    if (!user) return false;

    setAuthData(prevData => ({
      ...prevData,
      currentUser: user,
    }));

    return true;
  }, [authData.users, setAuthData]);

  /**
   * Logout current user
   */
  const logout = useCallback(() => {
    setAuthData(prevData => ({
      ...prevData,
      currentUser: null,
    }));
  }, [setAuthData]);

  /**
   * Update user's PIN
   */
  const updateUserPin = useCallback((userId: string, pin: string) => {
    setAuthData(prevData => {
      const updatedUsers = prevData.users.map(user =>
        user.id === userId ? { ...user, pin: pin || undefined } : user
      );

      // If updating current user's PIN, update currentUser as well
      const updatedCurrentUser = prevData.currentUser?.id === userId
        ? { ...prevData.currentUser, pin: pin || undefined }
        : prevData.currentUser;

      return {
        users: updatedUsers,
        currentUser: updatedCurrentUser,
      };
    });
  }, [setAuthData]);

  const value: AuthContextType = {
    currentUser: authData.currentUser,
    users: authData.users,
    login,
    logout,
    validatePin,
    updateUserPin,
    loading,
  };

  return (
    <PINAuthContext.Provider value={value}>
      {children}
    </PINAuthContext.Provider>
  );
};

export const usePINAuth = (): AuthContextType => {
  const context = useContext(PINAuthContext);
  if (context === undefined) {
    throw new Error('usePINAuth must be used within a PINAuthProvider');
  }
  return context;
};
