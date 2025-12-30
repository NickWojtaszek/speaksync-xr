/**
 * Authentication Service Interface
 *
 * This interface defines the contract for authentication services.
 * Implementations can be local (localStorage) or backend (API-based).
 */

import type { User, UserRole } from '../../types';

export interface AuthService {
  /**
   * Authenticate a user and return user data
   * @param username - Username or email
   * @param password - User password (optional for dev/local auth)
   * @param role - User role (for local dev only, backend should determine this)
   * @returns Authenticated user data
   * @throws AuthError if authentication fails
   */
  login(username: string, password?: string, role?: UserRole): Promise<User>;

  /**
   * End the current user session
   * @returns void
   */
  logout(): Promise<void>;

  /**
   * Get the currently authenticated user
   * @returns Current user or null if not authenticated
   */
  getCurrentUser(): Promise<User | null>;

  /**
   * Get all users (for user selection, admin purposes)
   * @returns Array of users
   */
  getUsers(): Promise<User[]>;

  /**
   * Validate if the current session is still valid
   * @returns true if session is valid
   */
  validateSession(): Promise<boolean>;

  /**
   * Refresh authentication token (for JWT-based auth)
   * @returns Updated user data
   */
  refreshToken?(): Promise<User>;
}

/**
 * Authentication error class
 */
export class AuthError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly originalError?: Error
  ) {
    super(message);
    this.name = 'AuthError';
  }
}

/**
 * Auth error codes
 */
export const AuthErrorCodes = {
  INVALID_CREDENTIALS: 'INVALID_CREDENTIALS',
  SESSION_EXPIRED: 'SESSION_EXPIRED',
  NETWORK_ERROR: 'NETWORK_ERROR',
  UNAUTHORIZED: 'UNAUTHORIZED',
  USER_NOT_FOUND: 'USER_NOT_FOUND',
} as const;
