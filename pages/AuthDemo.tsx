import React, { useState } from 'react';
import { useSupabaseAuth } from '../context/SupabaseAuthContext';
import { supabase } from '../lib/supabase';

export const AuthDemo: React.FC = () => {
  const { user, loading, signOut, isConfigured } = useSupabaseAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [authLoading, setAuthLoading] = useState(false);

  // Test data for sync demo
  const [testData, setTestData] = useState('');
  const [syncedData, setSyncedData] = useState<string | null>(null);

  if (!isConfigured) {
    return (
      <div style={{ padding: '2rem', maxWidth: '600px', margin: '0 auto' }}>
        <h1>Supabase Not Configured</h1>
        <p>Please add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to your environment variables.</p>
      </div>
    );
  }

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setMessage(null);
    setAuthLoading(true);

    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({
          email,
          password,
        });

        if (error) throw error;

        setMessage('Check your email for the confirmation link!');
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) throw error;

        setMessage('Signed in successfully!');
      }
    } catch (err: any) {
      setError(err.message || 'Authentication failed');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleSaveData = async () => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('user_settings')
        .upsert({
          user_id: user.id,
          settings: { demo_data: testData },
          updated_at: new Date().toISOString(),
        });

      if (error) throw error;

      setMessage('Data saved to Supabase! Open this page on another device to see it sync.');
    } catch (err: any) {
      setError(err.message || 'Failed to save data');
    }
  };

  const handleLoadData = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('user_settings')
        .select('settings')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') throw error;

      setSyncedData(data?.settings?.demo_data || 'No data found');
      setMessage('Data loaded from Supabase!');
    } catch (err: any) {
      setError(err.message || 'Failed to load data');
    }
  };

  if (loading) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div style={{ padding: '2rem', maxWidth: '600px', margin: '0 auto', fontFamily: 'system-ui' }}>
      <h1>Supabase Authentication Demo</h1>

      {user ? (
        <div>
          <div style={{ padding: '1rem', background: '#e8f5e9', borderRadius: '8px', marginBottom: '1rem' }}>
            <h2>✓ Signed In</h2>
            <p><strong>Email:</strong> {user.email}</p>
            <p><strong>User ID:</strong> {user.id}</p>
            <button
              onClick={signOut}
              style={{
                padding: '0.5rem 1rem',
                background: '#f44336',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
              }}
            >
              Sign Out
            </button>
          </div>

          <div style={{ padding: '1rem', background: '#f5f5f5', borderRadius: '8px' }}>
            <h3>Test Cross-Device Sync</h3>
            <p style={{ fontSize: '0.9rem', color: '#666' }}>
              Enter some data below, save it, then open this page on another device and load it!
            </p>

            <div style={{ marginTop: '1rem' }}>
              <input
                type="text"
                value={testData}
                onChange={(e) => setTestData(e.target.value)}
                placeholder="Enter test data..."
                style={{
                  width: '100%',
                  padding: '0.5rem',
                  marginBottom: '0.5rem',
                  borderRadius: '4px',
                  border: '1px solid #ddd',
                }}
              />
              <button
                onClick={handleSaveData}
                style={{
                  padding: '0.5rem 1rem',
                  background: '#4caf50',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  marginRight: '0.5rem',
                }}
              >
                Save to Cloud
              </button>
              <button
                onClick={handleLoadData}
                style={{
                  padding: '0.5rem 1rem',
                  background: '#2196f3',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                }}
              >
                Load from Cloud
              </button>
            </div>

            {syncedData !== null && (
              <div style={{ marginTop: '1rem', padding: '0.5rem', background: '#fff3cd', borderRadius: '4px' }}>
                <strong>Synced Data:</strong> {syncedData}
              </div>
            )}
          </div>
        </div>
      ) : (
        <form onSubmit={handleAuth} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <h2>{isSignUp ? 'Sign Up' : 'Sign In'}</h2>

          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            style={{
              padding: '0.75rem',
              borderRadius: '4px',
              border: '1px solid #ddd',
              fontSize: '1rem',
            }}
          />

          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
            style={{
              padding: '0.75rem',
              borderRadius: '4px',
              border: '1px solid #ddd',
              fontSize: '1rem',
            }}
          />

          <button
            type="submit"
            disabled={authLoading}
            style={{
              padding: '0.75rem',
              background: '#2196f3',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '1rem',
              fontWeight: 'bold',
            }}
          >
            {authLoading ? 'Loading...' : (isSignUp ? 'Sign Up' : 'Sign In')}
          </button>

          <button
            type="button"
            onClick={() => setIsSignUp(!isSignUp)}
            style={{
              padding: '0.5rem',
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              color: '#2196f3',
              textDecoration: 'underline',
            }}
          >
            {isSignUp ? 'Already have an account? Sign In' : "Don't have an account? Sign Up"}
          </button>
        </form>
      )}

      {error && (
        <div style={{ marginTop: '1rem', padding: '0.75rem', background: '#ffebee', color: '#c62828', borderRadius: '4px' }}>
          {error}
        </div>
      )}

      {message && (
        <div style={{ marginTop: '1rem', padding: '0.75rem', background: '#e8f5e9', color: '#2e7d32', borderRadius: '4px' }}>
          {message}
        </div>
      )}

      <div style={{ marginTop: '2rem', padding: '1rem', background: '#fff9c4', borderRadius: '4px', fontSize: '0.9rem' }}>
        <h3>How to Test Sync:</h3>
        <ol>
          <li>Sign up with an email and password</li>
          <li>Enter some test data and click "Save to Cloud"</li>
          <li>Open this page on another computer/browser</li>
          <li>Sign in with the same email/password</li>
          <li>Click "Load from Cloud" - you'll see your data!</li>
        </ol>
      </div>
    </div>
  );
};
