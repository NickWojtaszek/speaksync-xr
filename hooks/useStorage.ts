import { useLocalStorage } from './useLocalStorage';

/**
 * Universal storage hook that uses localStorage.
 *
 * Simplified from the previous Supabase-enabled version.
 * Now uses only localStorage for persistence.
 *
 * @param key - Storage key (without prefix)
 * @param initialValue - Default value if no data exists
 */
export function useStorage<T>(
  key: string,
  initialValue: T,
  _tableName?: string,  // Kept for backwards compatibility but unused
  _columnName?: string  // Kept for backwards compatibility but unused
): [T, (value: T | ((val: T) => T)) => void, boolean] {
  const [data, setData] = useLocalStorage(key, initialValue);

  // No loading needed for localStorage
  const loading = false;

  return [data, setData, loading];
}
