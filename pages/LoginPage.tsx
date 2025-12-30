import React, { useState, useEffect } from 'react';
import { useTranslations } from '../context/LanguageContext';
import { LogoIcon, UserIcon } from '../components/Icons';
import { useAuth } from '../context/AuthContext';
import type { UserRole } from '../types';

// Bypass login via URL params: ?bypass=username&role=rolename
const getBypassLogin = (): { username: string; role: UserRole } | null => {
  const params = new URLSearchParams(window.location.search);
  const username = params.get('bypass');
  const role = params.get('role') as UserRole | null;
  if (username && role && ['radiologist', 'verifier', 'accounting', 'teaching'].includes(role)) {
    return { username, role };
  }
  return null;
};

const ProfileCard: React.FC<{ name: string; onSelect: () => void }> = ({ name, onSelect }) => (
    <button
        onClick={onSelect}
        className="group flex flex-col items-center gap-4 p-8 bg-gray-800/50 border border-gray-700 rounded-lg cursor-pointer transition-all duration-300 hover:bg-purple-600/30 hover:border-purple-500 hover:scale-105 focus:outline-none focus:ring-4 focus:ring-purple-500/50 w-full"
    >
        <div className="w-24 h-24 bg-gray-700/50 rounded-full flex items-center justify-center border-2 border-gray-600 group-hover:border-purple-400 transition-colors pointer-events-none">
            <UserIcon className="w-12 h-12 text-gray-400 group-hover:text-purple-300 transition-colors" />
        </div>
        <span className="text-xl font-semibold text-gray-200 group-hover:text-white transition-colors pointer-events-none">{name.charAt(0).toUpperCase() + name.slice(1)}</span>
    </button>
);

const RoleCard: React.FC<{ role: UserRole; label: string; onSelect: () => void; isSelected?: boolean }> = ({ role, label, onSelect, isSelected }) => (
    <button
        onClick={onSelect}
        className={`p-6 rounded-lg font-semibold transition-all ${
            isSelected 
                ? 'bg-purple-600 border-2 border-purple-400 text-white scale-105' 
                : 'bg-gray-800/50 border border-gray-700 text-gray-300 hover:border-purple-500 hover:text-white'
        }`}
    >
        {label}
    </button>
);

const LoginPage: React.FC = () => {
  const { t } = useTranslations();
  const { login, users } = useAuth();
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const [selectedRole, setSelectedRole] = useState<UserRole>('radiologist');
  const [bypassLogin] = useState(() => getBypassLogin());

  useEffect(() => {
    if (bypassLogin) {
      login(bypassLogin.username, bypassLogin.role).catch(error => {
        console.error('Bypass login failed:', error);
      });
    }
  }, [bypassLogin, login]);

  const roles: { value: UserRole; label: string }[] = [
    { value: 'radiologist', label: 'Radiologist' },
    { value: 'verifier', label: 'Verifier' },
    { value: 'accounting', label: 'Accounting' },
    { value: 'teaching', label: 'Teaching' },
  ];

  const handleUserSelect = (userId: string) => {
    setSelectedUser(userId);
  };

  const handleRoleSelect = (role: UserRole) => {
    setSelectedRole(role);
  };

  const handleLogin = async () => {
    if (selectedUser) {
      try {
        await login(selectedUser, selectedRole);
      } catch (error) {
        console.error('Login failed:', error);
        // TODO: Show error message to user
        alert('Login failed. Please try again.');
      }
    }
  };

  if (bypassLogin) {
    return (
      <main className="min-h-screen w-screen flex items-center justify-center p-4 font-sans overflow-hidden">
        <div className="text-center">
          <LogoIcon className="h-20 w-20 text-purple-400 mx-auto mb-4" />
          <p className="text-gray-300">Logging in as {bypassLogin.username} ({bypassLogin.role})...</p>
          <p className="text-gray-500 text-sm mt-4 max-w-md">Dev Mode: Remove <code className="bg-gray-800 px-2 py-1 rounded">{`?bypass=${bypassLogin.username}&role=${bypassLogin.role}`}</code> from URL to login normally</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen w-screen flex items-center justify-center p-4 font-sans overflow-hidden">
      <div className="w-full max-w-4xl mx-auto">
        <div className="flex justify-center mb-8 animate-fade-in" style={{ animationDelay: '100ms' }}>
          <LogoIcon className="h-20 w-20 text-purple-400" />
        </div>
        
        <div className="relative text-center mb-12 animate-fade-in" style={{ animationDelay: '200ms' }}>
            <h1 className="text-4xl font-bold text-white tracking-tight">{t('app.title')}</h1>
            <p className="text-gray-400 text-lg mt-2">{t('login.welcome')}</p>
        </div>

        {!selectedUser ? (
          <>
            <p className="text-center text-gray-300 mb-8">Select your profile</p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 animate-fade-in" style={{ animationDelay: '300ms' }}>
                {users.map(user => (
                    <ProfileCard key={user.id} name={user.name} onSelect={() => handleUserSelect(user.id)} />
                ))}
            </div>
          </>
        ) : (
          <>
            <div className="bg-gray-800/30 border border-gray-700 rounded-lg p-8 mb-8">
              <p className="text-center text-gray-300 mb-4">
                Logged in as <span className="font-bold text-purple-300">{users.find(u => u.id === selectedUser)?.name}</span>
              </p>
              <p className="text-center text-gray-400 mb-6">Select your role:</p>
              
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
                {roles.map(role => (
                  <RoleCard
                    key={role.value}
                    role={role.value}
                    label={role.label}
                    onSelect={() => handleRoleSelect(role.value)}
                    isSelected={selectedRole === role.value}
                  />
                ))}
              </div>

              <div className="flex gap-4">
                <button
                  onClick={() => setSelectedUser(null)}
                  className="flex-1 px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white font-semibold rounded-lg transition-colors"
                >
                  Back
                </button>
                <button
                  onClick={handleLogin}
                  className="flex-1 px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-lg transition-colors"
                >
                  Login
                </button>
              </div>
            </div>
          </>
        )}

        {/* Dev Mode - Quick Login Links */}
        <div className="fixed bottom-4 left-4 bg-gray-800/80 border border-gray-700 rounded-lg p-4 max-w-xs">
          <p className="text-xs text-gray-400 mb-3 font-semibold">DEV MODE - Quick Login</p>
          <div className="space-y-2">
            {['nick', 'emilia', 'edyta'].map(username => 
              ['radiologist', 'verifier', 'accounting', 'teaching'].map(role => (
                <a
                  key={`${username}-${role}`}
                  href={`?bypass=${username}&role=${role}`}
                  className="block text-xs px-2 py-1 bg-gray-700 hover:bg-purple-600/50 text-gray-300 hover:text-white rounded transition-colors truncate"
                >
                  {username} → {role}
                </a>
              ))
            )}
          </div>
        </div>
      </div>
    </main>
  );
};

export default LoginPage;
