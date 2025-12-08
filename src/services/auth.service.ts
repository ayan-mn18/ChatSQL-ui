import { api } from '../lib/api';
import { 
  LoginRequest, 
  RegisterRequest, 
  VerifyEmailRequest, 
  ResendOtpRequest, 
  ForgotPasswordRequest, 
  ResetPasswordRequest, 
  UpdateProfileRequest, 
  ChangePasswordRequest,
  AuthResponse,
  User
} from '../types';

export const authService = {
  // Register
  register: async (data: RegisterRequest) => {
    const response = await api.post<AuthResponse>('/auth/register', data);
    return response.data;
  },

  // Verify Email
  verifyEmail: async (data: VerifyEmailRequest) => {
    const response = await api.post<AuthResponse>('/auth/verify-email', data);
    return response.data;
  },

  // Resend OTP
  resendOtp: async (data: ResendOtpRequest) => {
    const response = await api.post<AuthResponse>('/auth/resend-otp', data);
    return response.data;
  },

  // Login
  login: async (data: LoginRequest) => {
    const response = await api.post<AuthResponse>('/auth/login', data);
    return response.data;
  },

  // Logout
  logout: async () => {
    const response = await api.post<{ success: boolean }>('/auth/logout');
    return response.data;
  },

  // Get Current User
  getCurrentUser: async () => {
    const response = await api.get<{ success: boolean; data: { user: User } }>('/auth/me');
    return response.data;
  },

  // Forgot Password
  forgotPassword: async (data: ForgotPasswordRequest) => {
    const response = await api.post<{ success: boolean; message: string }>('/auth/forgot-password', data);
    return response.data;
  },

  // Reset Password
  resetPassword: async (data: ResetPasswordRequest) => {
    const response = await api.post<{ success: boolean; message: string }>('/auth/reset-password', data);
    return response.data;
  },

  // Update Profile
  updateProfile: async (data: UpdateProfileRequest) => {
    const response = await api.put<{ success: boolean; data: { user: User } }>('/auth/profile', data);
    return response.data;
  },

  // Change Password
  changePassword: async (data: ChangePasswordRequest) => {
    const response = await api.post<{ success: boolean; message: string }>('/auth/change-password', data);
    return response.data;
  },

  // Delete Account
  deleteAccount: async (password: string) => {
    const response = await api.delete<{ success: boolean; message: string }>('/auth/account', {
      data: { password }
    });
    return response.data;
  }
};
