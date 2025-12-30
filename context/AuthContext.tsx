import React, { createContext, useContext, ReactNode } from 'react';
import { useSupabaseAuth } from './SupabaseAuthContext';
import type { User, UserRole } from '../types';

interface AuthContextType {
  currentUser: User | null;
  logout: () => Promise<void>;
  profileCompleted: boolean;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user, signOut, loading } = useSupabaseAuth();

  // Bridge function: Map Supabase user to app User
  const currentUser: User | null = user ? {
    id: user.id,
    name: extractNameFromEmail(user.email || ''),
    email: user.email || undefined,
    role: 'radiologist' as UserRole, // Temporary default - will be replaced with profile data
  } : null;

  const logout = async () => {
    await signOut();
  };

  // Temporary: Will check actual profile completion status from database
  const profileCompleted = true;

  return (
    <AuthContext.Provider value={{ currentUser, logout, profileCompleted, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Helper function to extract name from email
function extractNameFromEmail(email: string): string {
  if (!email) return 'User';

  // Get part before @
  const localPart = email.split('@')[0];

  // Replace dots, underscores, hyphens with spaces
  const withSpaces = localPart.replace(/[._-]/g, ' ');

  // Capitalize first letter of each word
  return withSpaces
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}
