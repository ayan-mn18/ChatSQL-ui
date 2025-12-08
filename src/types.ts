export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  result?: QueryResult;
}

export interface QueryResult {
  data: any[];
  info: QueryDesc
}

export interface QueryDesc {
  columns: string[];
  error?: string;
  query?: string;
  desc?: string;
  reasoning?: {
    steps: string[];
    optimization_notes: string[];
  };
  tables_used?: string[];
  columns_used?: string[];
}

export interface QueryRequest {
  query: string;
  uri: string;
}

export interface Settings {
  dbName: string;
  dbUri: string;
  aiModel: 'openai' | 'claude';
}

// ============================================
// AUTH TYPES
// ============================================

export interface User {
  id: string;
  email: string;
  username: string | null;
  profile_url: string | null;
  is_verified: boolean;
  created_at: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  username?: string;
}

export interface VerifyEmailRequest {
  email: string;
  otp: string;
}

export interface ResendOtpRequest {
  email: string;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ResetPasswordRequest {
  token: string;
  newPassword: string;
}

export interface UpdateProfileRequest {
  username?: string;
  profile_url?: string;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

export interface AuthResponse {
  success: boolean;
  message?: string;
  data?: {
    user?: User;
    accessToken?: string;
    expiresIn?: number;
    email?: string;
  };
  error?: string;
  code?: string;
}
