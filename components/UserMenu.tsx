import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { LogoutIcon, UserIcon } from './Icons';

const ROLE_INFO: Record<string, { label: string; emoji: string }> = {
  admin: { label: 'Administrator', emoji: '👑' },
  verifier: { label: 'Verifier', emoji: '✓' },
  accounting: { label: 'Accounting', emoji: '💰' },
  teaching: { label: 'Teaching', emoji: '🎓' },
  user: { label: 'User', emoji: '👤' },
};

const UserMenu: React.FC = () => {
  const { currentUser, logout } = useAuth();
  const { currentTheme } = useTheme();
  const [isOpen, setIsOpen] = useState(false);

  if (!currentUser) return null;

  const displayName = currentUser.name || 'User';
  const initials = displayName
    .split(' ')
    .map(part => part[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 rounded-lg transition-all hover:scale-105 focus:outline-none"
        style={{
          backgroundColor: currentTheme.colors.bgSecondary,
          borderColor: currentTheme.colors.borderColor,
          borderWidth: '1px',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = currentTheme.colors.bgTertiary;
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = currentTheme.colors.bgSecondary;
        }}
      >
        <div
          className="flex items-center justify-center w-6 h-6 rounded-full text-xs font-semibold"
          style={{
            backgroundColor: currentTheme.colors.accentPrimary,
            color: '#fff',
          }}
        >
          {initials}
        </div>
        <span
          className="text-sm font-medium hidden sm:inline max-w-[150px] truncate"
          style={{ color: currentTheme.colors.textPrimary }}
        >
          {displayName}
        </span>
      </button>

      {isOpen && (
        <div
          className="absolute right-0 mt-2 w-56 rounded-lg shadow-lg border z-50"
          style={{
            backgroundColor: currentTheme.colors.bgPrimary,
            borderColor: currentTheme.colors.borderColor,
          }}
        >
          {/* User Info */}
          <div
            className="p-4 border-b"
            style={{ borderColor: currentTheme.colors.borderColor }}
          >
            <div className="flex items-center gap-3">
              <div
                className="flex items-center justify-center w-10 h-10 rounded-full text-sm font-semibold"
                style={{
                  backgroundColor: currentTheme.colors.accentPrimary,
                  color: '#fff',
                }}
              >
                {initials}
              </div>
              <div className="flex-1">
                <p
                  className="font-semibold text-sm"
                  style={{ color: currentTheme.colors.textPrimary }}
                >
                  {displayName}
                </p>
                {currentUser.email && (
                  <p
                    className="text-xs"
                    style={{ color: currentTheme.colors.textSecondary }}
                  >
                    {currentUser.email}
                  </p>
                )}
                <p
                  className="text-xs mt-1"
                  style={{ color: currentTheme.colors.textSecondary }}
                >
                  {currentUser.loginMethod === 'google'
                    ? '🔐 Google OAuth'
                    : '🏠 Local Account'}
                </p>
                {currentUser.role && (
                  <p
                    className="text-xs mt-1 font-medium"
                    style={{ color: currentTheme.colors.accentPrimary }}
                  >
                    {ROLE_INFO[currentUser.role]?.emoji} {ROLE_INFO[currentUser.role]?.label || currentUser.role}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Logout Button */}
          <button
            onClick={() => {
              logout();
              setIsOpen(false);
            }}
            className="w-full flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors hover:bg-opacity-80"
            style={{
              color: '#ef4444',
              backgroundColor: 'transparent',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#ef444420';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
            }}
          >
            <LogoutIcon className="w-4 h-4" />
            Logout
          </button>
        </div>
      )}

      {/* Overlay to close menu */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
};

export default UserMenu;
