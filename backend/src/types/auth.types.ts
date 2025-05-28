export type UserRole = 'vendor' | 'delivery' | 'customer';

export interface UserLoginRequest {
  email: string;
  password: string;
  role?: UserRole;
}

export interface UserRegisterRequest {
  name: string;
  email: string;
  password: string;
  role: UserRole;
  vendorId?: string; // Required for delivery partners
}

export interface UserResponse {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  vendorId?: string;
}

export interface AuthResponse {
  success: boolean;
  token: string;
  user: UserResponse;
}

export interface ApiError {
  success: boolean;
  error: string;
} 