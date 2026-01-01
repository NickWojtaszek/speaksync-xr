import React, { useState } from 'react';
import { LanguageProvider, useTranslations } from './context/LanguageContext';
import { SupabaseAuthProvider, useSupabaseAuth } from './context/SupabaseAuthContext';
import { AuthProvider } from './context/AuthContext';
import { AppContextProvider } from './context/AppContext';
import { TemplateProvider } from './context/TemplateContext';
import { SettingsProvider } from './context/SettingsContext';
import { StudyProvider } from './context/StudyContext';
import { ThemeProvider } from './context/ThemeContext';
import { ReportProvider } from './context/ReportContext';
import { TeachingCaseProvider } from './context/TeachingCaseContext';
import { GlobalThemeStyles } from './components/GlobalThemeStyles';
import ErrorBoundary from './components/ErrorBoundary';
import { checkEnvironment } from './utils/checkEnv';
import { supabase } from './lib/supabase';
import { LogoIcon } from './components/Icons';

import MainPage from './pages/MainPage';
import SettingsPage from './pages/SettingsPage';
import InterestingCasesLibrary from './pages/InterestingCasesLibrary';
import AccountingPage from './pages/AccountingPage';
import AIConfigurationPage from './pages/AIConfigurationPage';
import CaseViewerPage from './pages/CaseViewerPage';
import { AuthDemo } from './pages/AuthDemo';

import { useApp } from './context/AppContext';

// Check environment on load
checkEnvironment();


// The new AppContent component is a clean router.
// It uses the AppContext to determine which page to show.
const AppContent: React.FC = () => {
    const { view } = useApp();

    switch (view) {
        case 'settings':
            return (
                <ErrorBoundary resetKeys={[view]}>
                    <SettingsPage />
                </ErrorBoundary>
            );
        case 'library':
            return (
                <ErrorBoundary resetKeys={[view]}>
                    <InterestingCasesLibrary />
                </ErrorBoundary>
            );
        case 'accounting':
            return (
                <ErrorBoundary resetKeys={[view]}>
                    <AccountingPage />
                </ErrorBoundary>
            );
        case 'aiconfig':
            return (
                <ErrorBoundary resetKeys={[view]}>
                    <AIConfigurationPage />
                </ErrorBoundary>
            );
        case 'devcases':
            return (
                <ErrorBoundary resetKeys={[view]}>
                    <CaseViewerPage />
                </ErrorBoundary>
            );
        case 'authdemo':
            return (
                <ErrorBoundary resetKeys={[view]}>
                    <AuthDemo />
                </ErrorBoundary>
            );
        case 'main':
        default:
            return (
                <ErrorBoundary resetKeys={[view]}>
                    <MainPage />
                </ErrorBoundary>
            );
    }
};


// Sync Supabase user to local AuthContext
const AuthSyncBridge: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { user } = useSupabaseAuth();
    const { currentUser, login } = useAuth();

    React.useEffect(() => {
        if (user && !currentUser) {
            // Sync Supabase user to local auth context
            const name = user.user_metadata?.full_name || user.email?.split('@')[0] || 'User';
            login(name, 'radiologist'); // Default role
        }
    }, [user, currentUser, login]);

    return <>{children}</>;
};

// The main app component after authentication.
// It wraps all the data providers around the AppContent router.
const AuthenticatedApp: React.FC = () => (
    <AuthSyncBridge>
        <AppContextProvider>
            <SettingsProvider>
                <TemplateProvider>
                    <StudyProvider>
                        <ReportProvider>
                            <TeachingCaseProvider>
                                <AppContent />
                            </TeachingCaseProvider>
                        </ReportProvider>
                    </StudyProvider>
                </TemplateProvider>
            </SettingsProvider>
        </AppContextProvider>
    </AuthSyncBridge>
);

// Inline authentication component
const AuthForm: React.FC = () => {
    const { t } = useTranslations();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isSignUp, setIsSignUp] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [message, setMessage] = useState<string | null>(null);
    const [authLoading, setAuthLoading] = useState(false);

    const handleAuth = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setMessage(null);
        setAuthLoading(true);

        try {
            if (isSignUp) {
                const { error } = await supabase.auth.signUp({ email, password });
                if (error) throw error;
                setMessage('Account created! Check your email for confirmation link.');
                setEmail('');
                setPassword('');
                setIsSignUp(false);
            } else {
                const { error } = await supabase.auth.signInWithPassword({ email, password });
                if (error) throw error;
                setMessage('Signed in successfully!');
            }
        } catch (err: any) {
            setError(err.message || 'Authentication failed');
        } finally {
            setAuthLoading(false);
        }
    };

    const handleGoogleSignIn = async () => {
        setError(null);
        setMessage(null);
        try {
            const { error } = await supabase.auth.signInWithOAuth({
                provider: 'google',
                options: {
                    redirectTo: window.location.origin
                }
            });
            if (error) throw error;
        } catch (err: any) {
            setError(err.message || 'Google sign-in failed');
        }
    };

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

                <div className="bg-gray-800/30 border border-gray-700 rounded-lg p-8 animate-fade-in" style={{ animationDelay: '300ms' }}>
                    <h2 className="text-2xl font-bold text-white mb-6 text-center">
                        {isSignUp ? 'Create Account' : 'Sign In'}
                    </h2>

                    <button
                        type="button"
                        onClick={handleGoogleSignIn}
                        className="w-full px-6 py-3 bg-white hover:bg-gray-100 text-gray-900 font-semibold rounded-lg transition-colors flex items-center justify-center gap-3 mb-4"
                    >
                        <svg className="w-5 h-5" viewBox="0 0 24 24">
                            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                        </svg>
                        Continue with Google
                    </button>

                    <div className="relative my-6">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-gray-600"></div>
                        </div>
                        <div className="relative flex justify-center text-sm">
                            <span className="px-2 bg-gray-800 text-gray-400">or</span>
                        </div>
                    </div>

                    <form onSubmit={handleAuth} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">Email</label>
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
                            <label className="block text-sm font-medium text-gray-300 mb-2">Password</label>
                            <input
                                type="password"
                                placeholder="••••••••"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                minLength={6}
                                className="w-full px-4 py-3 bg-gray-900/50 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                            />
                            {isSignUp && <p className="text-xs text-gray-400 mt-1">Must be at least 6 characters</p>}
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
                    </form>
                </div>

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
                    <p>Sign in with the same account on multiple devices to sync your settings, studies, and teaching cases automatically.</p>
                </div>
            </div>
        </main>
    );
};

// A component to handle the authentication check.
const AuthWrapper: React.FC = () => {
    const { user, loading, isConfigured } = useSupabaseAuth();

    if (loading) {
        return (
            <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                minHeight: '100vh',
                color: '#a78bfa'
            }}>
                Loading...
            </div>
        );
    }

    if (!isConfigured) {
        return (
            <main className="min-h-screen w-screen flex items-center justify-center p-4 font-sans overflow-hidden">
                <div className="w-full max-w-md mx-auto text-center">
                    <LogoIcon className="h-20 w-20 text-purple-400 mx-auto mb-8" />
                    <div className="bg-red-900/20 border border-red-700 rounded-lg p-6">
                        <h2 className="text-xl font-bold text-red-400 mb-2">Configuration Error</h2>
                        <p className="text-gray-300">Supabase is not configured. Please contact your administrator.</p>
                    </div>
                </div>
            </main>
        );
    }

    return user ? <AuthenticatedApp /> : <AuthForm />;
};

// The root App component.
// It sets up the top-level providers for Authentication, Language, and Theme.
const App: React.FC = () => {
    return (
        <SupabaseAuthProvider>
            <ThemeProvider>
                <GlobalThemeStyles>
                    <LanguageProvider>
                        <AuthProvider>
                            <AuthWrapper />
                        </AuthProvider>
                    </LanguageProvider>
                </GlobalThemeStyles>
            </ThemeProvider>
        </SupabaseAuthProvider>
    );
};

export default App;
