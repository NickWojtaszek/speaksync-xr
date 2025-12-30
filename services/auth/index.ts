/**
 * Authentication Service Configuration
 *
 * This file controls which authentication implementation is used.
 * Switch between LocalAuthService (dev) and BackendAuthService (production)
 * by changing the single line below.
 */

import { LocalAuthService } from './LocalAuthService';
// import { BackendAuthService } from './BackendAuthService';

// ===== CONFIGURATION =====
// Change this line to switch authentication methods:

/**
 * Current: Local development authentication (no backend required)
 * For production: Uncomment BackendAuthService and comment out LocalAuthService
 */
export const authService = new LocalAuthService();

// For production with backend:
// export const authService = new BackendAuthService();

// ===== EXPORTS =====
export type { AuthService } from './AuthService';
export { AuthError, AuthErrorCodes } from './AuthService';
export { LocalAuthService } from './LocalAuthService';
export { BackendAuthService } from './BackendAuthService';
