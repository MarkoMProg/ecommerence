/**
 * Extended user type from better-auth session.
 * Base fields from better-auth; role and twoFactorEnabled from plugins.
 */
export interface AuthUser {
  id: string;
  email: string;
  name: string;
  image?: string | null;
  emailVerified?: boolean;
  /** From better-auth admin plugin */
  role?: string;
  /** From better-auth twoFactor plugin */
  twoFactorEnabled?: boolean | null;
}
