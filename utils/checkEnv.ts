// Diagnostic utility to check environment variables
export const checkEnvironment = () => {
  console.log('=== Environment Check ===');
  console.log('VITE_SUPABASE_URL:', import.meta.env.VITE_SUPABASE_URL || 'NOT SET');
  console.log('VITE_SUPABASE_ANON_KEY:', import.meta.env.VITE_SUPABASE_ANON_KEY ? 'SET (hidden)' : 'NOT SET');
  console.log('VITE_DEV_BADGES:', import.meta.env.VITE_DEV_BADGES || 'NOT SET');
  console.log('========================');
};
