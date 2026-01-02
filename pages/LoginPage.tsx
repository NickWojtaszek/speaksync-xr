import React, { useState, useEffect } from 'react';
import { usePINAuth } from '../context/PINAuthContext';
import { useTranslations } from '../context/LanguageContext';
import { LogoIcon } from '../components/Icons';
import type { User } from '../types/auth';

const LoginPage: React.FC = () => {
  const { users, login, validatePin } = usePINAuth();
  const { t } = useTranslations();

  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Clear PIN when user changes
  useEffect(() => {
    setPin('');
    setError('');
  }, [selectedUser]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!selectedUser) {
      setError('Please select a user');
      return;
    }

    setLoading(true);

    try {
      // If user has a PIN configured, validate it
      if (selectedUser.pin) {
        if (!pin) {
          setError('Please enter your PIN');
          setLoading(false);
          return;
        }

        if (pin.length !== 4) {
          setError('PIN must be 4 digits');
          setLoading(false);
          return;
        }

        if (!validatePin(selectedUser.id, pin)) {
          setError('Invalid PIN');
          setPin('');
          setLoading(false);
          return;
        }
      }

      // Login successful
      const success = login(selectedUser.id);
      if (!success) {
        setError('Login failed. Please try again.');
      }
    } catch (err: any) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handlePinInput = (value: string) => {
    // Only allow digits, max 4 characters
    const cleaned = value.replace(/\D/g, '').slice(0, 4);
    setPin(cleaned);
  };

  const requiresPin = selectedUser?.pin !== undefined;

  return (
    <main className="min-h-screen w-screen flex items-center justify-center p-4 font-sans overflow-hidden bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900">
      <div className="w-full max-w-md mx-auto">
        {/* Logo */}
        <div className="flex justify-center mb-8 animate-fade-in">
          <LogoIcon className="h-20 w-20 text-blue-400" />
        </div>

        {/* Title */}
        <div className="relative text-center mb-12 animate-fade-in" style={{ animationDelay: '100ms' }}>
          <h1 className="text-4xl font-bold text-white tracking-tight">
            {t('app.title')}
          </h1>
          <p className="text-gray-400 text-lg mt-2">{t('login.welcome')}</p>
        </div>

        {/* Login Form */}
        <div className="bg-gray-800/30 backdrop-blur-xl border border-gray-700 rounded-lg p-8 shadow-2xl animate-fade-in" style={{ animationDelay: '200ms' }}>
          <h2 className="text-2xl font-bold text-white mb-6 text-center">
            Staff Login
          </h2>

          <form onSubmit={handleLogin} className="space-y-4">
            {/* User Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Select Staff Member
              </label>
              <select
                value={selectedUser?.id || ''}
                onChange={(e) => {
                  const user = users.find(u => u.id === e.target.value);
                  setSelectedUser(user || null);
                }}
                className="w-full px-4 py-3 bg-gray-900/50 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                required
              >
                <option value="">-- Select User --</option>
                {users.map(user => (
                  <option key={user.id} value={user.id}>
                    {user.name} ({user.role})
                  </option>
                ))}
              </select>
            </div>

            {/* PIN Input (only if user requires PIN) */}
            {selectedUser && requiresPin && (
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  PIN (4 digits)
                </label>
                <input
                  type="password"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  value={pin}
                  onChange={(e) => handlePinInput(e.target.value)}
                  placeholder="••••"
                  maxLength={4}
                  className="w-full px-4 py-3 bg-gray-900/50 border border-gray-600 rounded-lg text-white text-center text-2xl tracking-widest placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  autoFocus
                />
              </div>
            )}

            {/* Info Message */}
            {selectedUser && !requiresPin && (
              <div className="bg-blue-900/20 border border-blue-700 rounded-lg p-3">
                <p className="text-sm text-blue-300 text-center">
                  No PIN required for this user
                </p>
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div className="bg-red-900/20 border border-red-700 rounded-lg p-3">
                <p className="text-sm text-red-400 text-center">{error}</p>
              </div>
            )}

            {/* Login Button */}
            <button
              type="submit"
              disabled={loading || !selectedUser}
              className="w-full px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-colors"
            >
              {loading ? 'Logging in...' : 'Login'}
            </button>
          </form>
        </div>

        {/* Info Footer */}
        <div className="mt-8 p-4 bg-blue-900/20 border border-blue-700 rounded-lg text-sm text-gray-300 animate-fade-in" style={{ animationDelay: '300ms' }}>
          <p className="text-center">
            PIN is optional. Users without a PIN can log in directly.
          </p>
        </div>
      </div>

      <style>{`
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-fade-in {
          animation: fade-in 0.5s ease-out forwards;
          opacity: 0;
        }
      `}</style>
    </main>
  );
};

export default LoginPage;
