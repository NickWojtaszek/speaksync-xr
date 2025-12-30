import React, { useState } from 'react';
import { useTranslations } from '../context/LanguageContext';
import { LogoIcon } from '../components/Icons';
import { useSupabaseAuth } from '../context/SupabaseAuthContext';
import { supabase } from '../lib/supabase';

const LoginPage: React.FC = () => {
  const { t } = useTranslations();
  const { user, loading, isConfigured } = useSupabaseAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [authLoading, setAuthLoading] = useState(false);

  // If user is already logged in, this page won't show (handled by App.tsx)
  // This is just the login form

  if (!isConfigured) {
    return (
      <main className="min-h-screen w-screen flex items-center justify-center p-4 font-sans overflow-hidden">
        <div className="w-full max-w-md mx-auto text-center">
          <LogoIcon className="h-20 w-20 text-purple-400 mx-auto mb-8" />
          <div className="bg-red-900/20 border border-red-700 rounded-lg p-6">
            <h2 className="text-xl font-bold text-red-400 mb-2">Configuration Error</h2>
            <p className="text-gray-300">
              Supabase is not configured. Please contact your administrator.
            </p>
          </div>
        </div>
      </main>
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

        setMessage('Account created! Check your email for confirmation link.');
        setEmail('');
        setPassword('');
        setIsSignUp(false);
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

  if (loading) {
    return (
      <main className="min-h-screen w-screen flex items-center justify-center p-4 font-sans overflow-hidden">
        <div className="text-center">
          <LogoIcon className="h-20 w-20 text-purple-400 mx-auto mb-4 animate-pulse" />
          <p className="text-gray-300">Loading...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen w-screen flex items-center justify-center p-4 font-sans overflow-hidden">
      <div className="w-full max-w-md mx-auto">
        <div className="flex justify-center mb-8 animate-fade-in" style={{ animationDelay: '100ms' }}>
          <LogoIcon className="h-20 w-20 text-purple-400" />
        </div>

        <div className="relative text-center mb-12 animate-fade-in" style={{ animationDelay: '200ms' }}>
          <h1 className="text-4xl font-bold text-white tracking-tight">{t('app.title')}</h1>
          <p className="text-gray-400 text-lg mt-2">{t('login.welcome')}</p>
        </div>

        <form
          onSubmit={handleAuth}
          className="bg-gray-800/30 border border-gray-700 rounded-lg p-8 animate-fade-in"
          style={{ animationDelay: '300ms' }}
        >
          <h2 className="text-2xl font-bold text-white mb-6 text-center">
            {isSignUp ? 'Create Account' : 'Sign In'}
          </h2>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Email
              </label>
              <input
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-3 bg-gray-900/50 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Password
              </label>
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                className="w-full px-4 py-3 bg-gray-900/50 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
              />
              {isSignUp && (
                <p className="text-xs text-gray-400 mt-1">Must be at least 6 characters</p>
              )}
            </div>

            <button
              type="submit"
              disabled={authLoading}
              className="w-full px-6 py-3 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-800 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-colors"
            >
              {authLoading ? 'Loading...' : (isSignUp ? 'Sign Up' : 'Sign In')}
            </button>

            <button
              type="button"
              onClick={() => {
                setIsSignUp(!isSignUp);
                setError(null);
                setMessage(null);
              }}
              className="w-full text-purple-400 hover:text-purple-300 text-sm transition-colors"
            >
              {isSignUp ? 'Already have an account? Sign In' : "Don't have an account? Sign Up"}
            </button>
          </div>
        </form>

        {error && (
          <div className="mt-4 p-4 bg-red-900/20 border border-red-700 rounded-lg text-red-400 animate-fade-in">
            {error}
          </div>
        )}

        {message && (
          <div className="mt-4 p-4 bg-green-900/20 border border-green-700 rounded-lg text-green-400 animate-fade-in">
            {message}
          </div>
        )}

        <div className="mt-8 p-4 bg-blue-900/20 border border-blue-700 rounded-lg text-sm text-gray-300 animate-fade-in" style={{ animationDelay: '400ms' }}>
          <h3 className="font-semibold text-blue-400 mb-2">Cross-Device Sync Enabled</h3>
          <p>
            Sign in with the same account on multiple devices to sync your settings, studies, and teaching cases automatically.
          </p>
        </div>
      </div>
    </main>
  );
};

export default LoginPage;
