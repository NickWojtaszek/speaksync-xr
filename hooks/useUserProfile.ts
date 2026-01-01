import { useState, useEffect } from 'react';
import { useSupabaseAuth } from '../context/SupabaseAuthContext';
import { supabase } from '../lib/supabase';
import type { UserRole } from '../types';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: UserRole;
}

interface UseUserProfileReturn {
  currentUser: UserProfile | null;
  users: UserProfile[]; // Legacy compatibility - always empty array
  login: (username: string, role: UserRole) => void; // Legacy compatibility - no-op
  logout: () => Promise<void>;
  loading: boolean;
}

/**
 * Supabase-based user profile hook
 * Provides backward compatibility with legacy AuthContext interface
 */
export function useUserProfile(): UseUserProfileReturn {
  const { user, signOut, loading: authLoading } = useSupabaseAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setProfile(null);
      setLoading(false);
      return;
    }

    let isMounted = true;

    async function loadProfile() {
      try {
        // Try to fetch existing profile from database
        const { data, error } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('id', user.id)
          .single();

        if (error) {
          // Profile doesn't exist yet - create it
          if (error.code === 'PGRST116') {
            const newProfile = {
              id: user.id,
              email: user.email || 'unknown@email.com',
              name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'User',
              role: (user.user_metadata?.role as UserRole) || 'radiologist',
            };

            const { error: insertError } = await supabase
              .from('user_profiles')
              .insert([newProfile]);

            if (insertError) {
              console.error('Error creating profile:', insertError);
              // Fall back to user metadata
              if (isMounted) {
                setProfile(newProfile);
              }
            } else {
              if (isMounted) {
                setProfile(newProfile);
              }
            }
          } else {
            console.error('Error fetching profile:', error);
            // Fall back to constructing from auth user
            if (isMounted) {
              setProfile({
                id: user.id,
                email: user.email || 'unknown@email.com',
                name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'User',
                role: (user.user_metadata?.role as UserRole) || 'radiologist',
              });
            }
          }
        } else {
          // Profile exists in database
          if (isMounted) {
            setProfile({
              id: data.id,
              email: data.email,
              name: data.name,
              role: data.role as UserRole,
            });
          }
        }
      } catch (err) {
        console.error('Error loading user profile:', err);
        // Last resort fallback
        if (isMounted) {
          setProfile({
            id: user.id,
            email: user.email || 'unknown@email.com',
            name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'User',
            role: (user.user_metadata?.role as UserRole) || 'radiologist',
          });
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    loadProfile();

    return () => {
      isMounted = false;
    };
  }, [user]);

  // Legacy compatibility: login function (no-op, auth handled by Supabase)
  const login = () => {
    console.warn('useUserProfile: login() is deprecated. Use Supabase auth instead.');
  };

  // Logout function
  const logout = async () => {
    await signOut();
    setProfile(null);
  };

  return {
    currentUser: profile,
    users: [], // Legacy compatibility - no longer used
    login,
    logout,
    loading: authLoading || loading,
  };
}
