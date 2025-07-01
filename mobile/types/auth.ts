export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  profileImage: String;
  role: 'patient' | 'practitioner' | 'admin';
  isVerified: boolean;
  isEmailVerified: boolean; // Add this field
  status: 'ACTIVE' | 'PENDING' | 'SUSPENDED' | 'INACTIVE'; // Add status
  createdAt: string;
  updatedAt: string;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  role: 'patient' | 'practitioner';
}

export interface ForgotPasswordRequest {
  email: string;
}

// Add new interfaces
export interface VerifyEmailRequest {
  token: string;
}

export interface ResetPasswordRequest {
  token: string;
  password: string;
}

export interface ResendVerificationRequest {
  email: string;
}

export interface OTPVerificationRequest {
  email: string;
  otp: string;
  type: 'registration' | 'password_reset';
}

export interface AuthResponse {
  token: string | undefined;
  user: User;
  message: string;
}
