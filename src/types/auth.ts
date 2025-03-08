export interface User {
  id: string;
  email: string;
  name?: string;
  ghlApiKey?: string; // GoHighLevel sub-account API key
  ghlLocationId?: string; // GoHighLevel location ID
  createdAt: string;
  lastLogin?: string;
}

export interface AuthState {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  error: string | null;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface SignupCredentials {
  email: string;
  password: string;
  name?: string;
  ghlApiKey?: string;
  ghlLocationId?: string;
}

export interface AuthResponse {
  user: User;
  token: string;
} 


/// Acutual API types - GHL

export interface TokenResponse {
  access_token: string;
  refresh_token?: string;
  locationId?: string;
  userId?: string;
  companyId?: string;
  userType?: string;
}

export interface CookieOptions {
  httpOnly: boolean;
  secure: boolean;
  sameSite: 'lax' | 'strict' | 'none';
  path: string;
  maxAge: number;
}