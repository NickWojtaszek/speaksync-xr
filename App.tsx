import React from 'react';
import { LanguageProvider } from './context/LanguageContext';
import { SupabaseAuthProvider, useSupabaseAuth } from './context/SupabaseAuthContext';
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

import LoginPage from './pages/LoginPage';
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


// The main app component after authentication.
// It wraps all the data providers around the AppContent router.
const AuthenticatedApp: React.FC = () => (
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
);

// A component to handle the authentication check.
const AuthWrapper: React.FC = () => {
    const { user, loading } = useSupabaseAuth();

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

    return user ? <AuthenticatedApp /> : <LoginPage />;
};

// The root App component.
// It sets up the top-level providers for Authentication, Language, and Theme.
const App: React.FC = () => {
    return (
        <SupabaseAuthProvider>
            <ThemeProvider>
                <GlobalThemeStyles>
                    <LanguageProvider>
                        <AuthWrapper />
                    </LanguageProvider>
                </GlobalThemeStyles>
            </ThemeProvider>
        </SupabaseAuthProvider>
    );
};

export default App;
