import { useState, useEffect, useCallback } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { useLocalStorage } from './useLocalStorage';

/**
 * Universal storage hook that automatically uses Supabase when authenticated,
 * and falls back to localStorage otherwise.
 *
 * This provides a seamless migration path:
 * - Unauthenticated users: works exactly like useLocalStorage
 * - Authenticated users: syncs data across devices via Supabase
 *
 * @param key - Storage key (without prefix)
 * @param initialValue - Default value if no data exists
 * @param tableName - Supabase table name (optional, defaults to 'user_settings')
 * @param columnName - Column name in Supabase table (optional, defaults to 'settings')
 */
export function useStorage<T>(
  key: string,
  initialValue: T,
  tableName: string = 'user_settings',
  columnName: string = 'settings'
): [T, (value: T | ((val: T) => T)) => void, boolean] {
  // Fallback to localStorage if Supabase not configured
  const [localData, setLocalData] = useLocalStorage(key, initialValue);
  const [data, setData] = useState<T>(localData);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);

  // Check authentication status
  useEffect(() => {
    if (!isSupabaseConfigured()) {
      setLoading(false);
      return;
    }

    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUserId(user?.id || null);

      if (user?.id) {
        // Load from Supabase
        await loadFromSupabase(user.id);
      }

      setLoading(false);
    };

    checkAuth();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      const newUserId = session?.user?.id || null;
      setUserId(newUserId);

      if (newUserId) {
        await loadFromSupabase(newUserId);
      } else {
        // User logged out, use localStorage
        setData(localData);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // Load data from Supabase
  const loadFromSupabase = async (uid: string) => {
    try {
      const { data: result, error } = await supabase
        .from(tableName)
        .select(columnName)
        .eq('user_id', uid)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows
        console.error('Error loading from Supabase:', error);
        return;
      }

      if (result && result[columnName]) {
        // Check if it's the specific key or full settings object
        const supabaseData = result[columnName];
        if (typeof supabaseData === 'object' && key in supabaseData) {
          setData(supabaseData[key]);
        } else {
          setData(supabaseData);
        }
      }
    } catch (err) {
      console.error('Failed to load from Supabase:', err);
    }
  };

  // Save data
  const setValue = useCallback(async (value: T | ((val: T) => T)) => {
    const newValue = value instanceof Function ? value(data) : value;
    setData(newValue);

    // Always save to localStorage as backup
    setLocalData(newValue);

    // If authenticated, also save to Supabase
    if (userId && isSupabaseConfigured()) {
      try {
        const { error } = await supabase
          .from(tableName)
          .upsert({
            user_id: userId,
            [columnName]: { [key]: newValue },
            updated_at: new Date().toISOString(),
          });

        if (error) {
          console.error('Error saving to Supabase:', error);
        }
      } catch (err) {
        console.error('Failed to save to Supabase:', err);
      }
    }
  }, [userId, data, key, tableName, columnName, setLocalData]);

  return [data, setValue, loading];
}
