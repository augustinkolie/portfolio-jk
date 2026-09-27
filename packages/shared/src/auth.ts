// Règles partagées entre l'API (class-validator) et l'admin (zod).
export const PASSWORD_MIN_LENGTH = 12;
export const PASSWORD_MAX_LENGTH = 128;
export const MAX_FAILED_LOGIN_ATTEMPTS = 5;
export const LOGIN_LOCK_MINUTES = 15;

export interface LoginRequest {
  email: string;
  password: string;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

export interface AdminUser {
  id: string;
  email: string;
  name: string;
}

/** Le refresh token n'apparaît jamais ici : il voyage uniquement en cookie httpOnly. */
export interface AuthResponse {
  accessToken: string;
  /** Durée de validité de l'access token, en secondes. */
  expiresIn: number;
  user: AdminUser;
}
