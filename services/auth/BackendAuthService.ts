/**
 * Backend Authentication Service (TEMPLATE/STUB)
 *
 * This is a template for implementing backend-based authentication.
 * Replace LocalAuthService with this when you have a backend API.
 *
 * IMPLEMENTATION CHECKLIST:
 * ☐ Set up backend API endpoints (see below)
 * ☐ Configure CORS on your backend
 * ☐ Implement token storage (secure httpOnly cookies or encrypted localStorage)
 * ☐ Add token refresh logic
 * ☐ Implement session validation
 * ☐ Add error handling for network failures
 * ☐ Update AUTH_CONFIG constant below with your API URL
 */

import type { User, UserRole } from '../../types';
import { AuthService, AuthError, AuthErrorCodes } from './AuthService';

// ===== CONFIGURATION =====
const AUTH_CONFIG = {
  API_URL: process.env.VITE_API_URL || 'http://localhost:3001/api',
  TOKEN_STORAGE_KEY: 'auth_token',
  REFRESH_TOKEN_KEY: 'refresh_token',
  TOKEN_REFRESH_INTERVAL: 15 * 60 * 1000, // 15 minutes
};

// ===== REQUIRED API ENDPOINTS =====
/**
 * Your backend must implement these endpoints:
 *
 * POST /api/auth/login
 *   Body: { username: string, password: string }
 *   Response: { user: User, token: string, refreshToken?: string }
 *
 * POST /api/auth/logout
 *   Headers: { Authorization: 'Bearer {token}' }
 *   Response: { success: boolean }
 *
 * GET /api/auth/me
 *   Headers: { Authorization: 'Bearer {token}' }
 *   Response: { user: User }
 *
 * GET /api/users
 *   Headers: { Authorization: 'Bearer {token}' }
 *   Response: { users: User[] }
 *
 * POST /api/auth/refresh
 *   Body: { refreshToken: string }
 *   Response: { token: string, refreshToken?: string }
 *
 * POST /api/auth/validate
 *   Headers: { Authorization: 'Bearer {token}' }
 *   Response: { valid: boolean }
 */

export class BackendAuthService implements AuthService {
  private token: string | null = null;
  private refreshTokenValue: string | null = null;
  private refreshTimer: NodeJS.Timeout | null = null;

  constructor() {
    // Load tokens from storage on initialization
    this.loadTokens();
  }

  /**
   * Load tokens from storage
   */
  private loadTokens(): void {
    try {
      this.token = localStorage.getItem(AUTH_CONFIG.TOKEN_STORAGE_KEY);
      this.refreshTokenValue = localStorage.getItem(AUTH_CONFIG.REFRESH_TOKEN_KEY);
    } catch (error) {
      console.error('Failed to load auth tokens:', error);
    }
  }

  /**
   * Save tokens to storage
   */
  private saveTokens(token: string, refreshToken?: string): void {
    try {
      localStorage.setItem(AUTH_CONFIG.TOKEN_STORAGE_KEY, token);
      this.token = token;

      if (refreshToken) {
        localStorage.setItem(AUTH_CONFIG.REFRESH_TOKEN_KEY, refreshToken);
        this.refreshTokenValue = refreshToken;
      }

      // Start automatic token refresh
      this.startTokenRefresh();
    } catch (error) {
      console.error('Failed to save auth tokens:', error);
    }
  }

  /**
   * Clear tokens from storage
   */
  private clearTokens(): void {
    localStorage.removeItem(AUTH_CONFIG.TOKEN_STORAGE_KEY);
    localStorage.removeItem(AUTH_CONFIG.REFRESH_TOKEN_KEY);
    this.token = null;
    this.refreshTokenValue = null;

    if (this.refreshTimer) {
      clearInterval(this.refreshTimer);
      this.refreshTimer = null;
    }
  }

  /**
   * Make authenticated API request
   */
  private async apiRequest<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${AUTH_CONFIG.API_URL}${endpoint}`;
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    // Add auth token if available
    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });

      if (!response.ok) {
        if (response.status === 401) {
          // Token expired, try to refresh
          if (this.refreshTokenValue) {
            await this.refreshToken();
            // Retry the request with new token
            return this.apiRequest(endpoint, options);
          }
          throw new AuthError('Session expired', AuthErrorCodes.SESSION_EXPIRED);
        }

        const errorData = await response.json().catch(() => ({}));
        throw new AuthError(
          errorData.message || `API error: ${response.status}`,
          AuthErrorCodes.NETWORK_ERROR
        );
      }

      return response.json();
    } catch (error) {
      if (error instanceof AuthError) {
        throw error;
      }
      throw new AuthError(
        'Network request failed',
        AuthErrorCodes.NETWORK_ERROR,
        error instanceof Error ? error : undefined
      );
    }
  }

  /**
   * Start automatic token refresh
   */
  private startTokenRefresh(): void {
    if (this.refreshTimer) {
      clearInterval(this.refreshTimer);
    }

    this.refreshTimer = setInterval(() => {
      this.refreshToken().catch(error => {
        console.error('Token refresh failed:', error);
        this.clearTokens();
      });
    }, AUTH_CONFIG.TOKEN_REFRESH_INTERVAL);
  }

  /**
   * Login with username and password
   */
  async login(username: string, password?: string, _role?: UserRole): Promise<User> {
    if (!password) {
      throw new AuthError('Password is required', AuthErrorCodes.INVALID_CREDENTIALS);
    }

    const response = await this.apiRequest<{
      user: User;
      token: string;
      refreshToken?: string;
    }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    });

    this.saveTokens(response.token, response.refreshToken);
    return response.user;
  }

  /**
   * Logout
   */
  async logout(): Promise<void> {
    try {
      await this.apiRequest('/auth/logout', {
        method: 'POST',
      });
    } catch (error) {
      console.error('Logout API call failed:', error);
    } finally {
      this.clearTokens();
    }
  }

  /**
   * Get current user from backend
   */
  async getCurrentUser(): Promise<User | null> {
    if (!this.token) {
      return null;
    }

    try {
      const response = await this.apiRequest<{ user: User }>('/auth/me');
      return response.user;
    } catch (error) {
      console.error('Failed to get current user:', error);
      this.clearTokens();
      return null;
    }
  }

  /**
   * Get all users
   */
  async getUsers(): Promise<User[]> {
    const response = await this.apiRequest<{ users: User[] }>('/users');
    return response.users;
  }

  /**
   * Validate current session
   */
  async validateSession(): Promise<boolean> {
    if (!this.token) {
      return false;
    }

    try {
      const response = await this.apiRequest<{ valid: boolean }>('/auth/validate');
      return response.valid;
    } catch {
      return false;
    }
  }

  /**
   * Refresh authentication token
   */
  async refreshToken(): Promise<User> {
    if (!this.refreshTokenValue) {
      throw new AuthError('No refresh token available', AuthErrorCodes.SESSION_EXPIRED);
    }

    const response = await this.apiRequest<{
      token: string;
      refreshToken?: string;
      user: User;
    }>('/auth/refresh', {
      method: 'POST',
      body: JSON.stringify({ refreshToken: this.refreshTokenValue }),
    });

    this.saveTokens(response.token, response.refreshToken);
    return response.user;
  }
}

// ===== USAGE EXAMPLE =====
/**
 * To switch to backend authentication:
 *
 * 1. In services/auth/index.ts, change:
 *    export const authService = new LocalAuthService();
 *    to:
 *    export const authService = new BackendAuthService();
 *
 * 2. Set your API URL in .env:
 *    VITE_API_URL=https://your-api.com/api
 *
 * 3. Implement the required backend endpoints (see above)
 *
 * 4. Test thoroughly with your backend
 */
