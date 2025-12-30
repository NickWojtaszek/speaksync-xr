/**
 * Local Authentication Service
 *
 * Development-only authentication using localStorage.
 * No real security - usernames are trusted, no passwords required.
 *
 * ⚠️ WARNING: This is for DEVELOPMENT ONLY.
 * For production, replace with BackendAuthService.
 */

import type { User, UserRole, AuthData } from '../../types';
import { AuthService, AuthError, AuthErrorCodes } from './AuthService';

const AUTH_STORAGE_KEY = 'speaksync_auth_v2';

const INITIAL_USERS: User[] = [
  { id: 'nick', name: 'Nick', role: 'radiologist' },
  { id: 'emilia', name: 'Emilia', role: 'radiologist' },
  { id: 'edyta', name: 'Edyta', role: 'verifier' },
];

export class LocalAuthService implements AuthService {
  /**
   * Get auth data from localStorage
   */
  private getAuthData(): AuthData {
    try {
      const stored = localStorage.getItem(AUTH_STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (error) {
      console.error('Error reading auth data from localStorage:', error);
    }

    return {
      users: INITIAL_USERS,
      currentUser: null,
    };
  }

  /**
   * Save auth data to localStorage
   */
  private setAuthData(data: AuthData): void {
    try {
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(data));
    } catch (error) {
      console.error('Error saving auth data to localStorage:', error);
      throw new AuthError('Failed to save authentication data', AuthErrorCodes.NETWORK_ERROR);
    }
  }

  /**
   * Login - Create/update user and set as current
   * No password validation in local mode
   */
  async login(username: string, _password?: string, role?: UserRole): Promise<User> {
    if (!username || !username.trim()) {
      throw new AuthError('Username is required', AuthErrorCodes.INVALID_CREDENTIALS);
    }

    if (!role) {
      throw new AuthError('Role is required for local auth', AuthErrorCodes.INVALID_CREDENTIALS);
    }

    const userId = username.toLowerCase().trim();
    const authData = this.getAuthData();

    // Find or create user
    const existingUser = authData.users.find(u => u.id === userId);
    const user: User = existingUser
      ? { ...existingUser, role }
      : {
          id: userId,
          name: username.charAt(0).toUpperCase() + username.slice(1),
          role,
        };

    // Update users list
    const newUsers = existingUser
      ? authData.users.map(u => (u.id === userId ? user : u))
      : [...authData.users, user];

    // Save with user as current
    this.setAuthData({
      users: newUsers,
      currentUser: user,
    });

    return user;
  }

  /**
   * Logout - Clear current user
   */
  async logout(): Promise<void> {
    const authData = this.getAuthData();
    this.setAuthData({
      ...authData,
      currentUser: null,
    });
  }

  /**
   * Get current authenticated user
   */
  async getCurrentUser(): Promise<User | null> {
    const authData = this.getAuthData();
    return authData.currentUser;
  }

  /**
   * Get all users (for selection dropdown)
   */
  async getUsers(): Promise<User[]> {
    const authData = this.getAuthData();
    return authData.users;
  }

  /**
   * Validate session - Always valid in local mode
   */
  async validateSession(): Promise<boolean> {
    const user = await this.getCurrentUser();
    return user !== null;
  }
}
