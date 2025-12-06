import { useState } from 'react';
import { Mail, Lock, User, ArrowRight, Loader2, AlertCircle, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface SignUpFormProps {
  onNext: (data: { email: string; username: string; password: string }) => void;
  isLoading?: boolean;
  error?: string;
}

const PasswordRequirement = ({ met, text }: { met: boolean; text: string }) => (
  <div className={`flex items-center gap-2 text-sm ${met ? 'text-green-400' : 'text-gray-500'}`}>
    <Check className={`w-4 h-4 ${met ? 'opacity-100' : 'opacity-30'}`} />
    {text}
  </div>
);

export function SignUpForm({ onNext, isLoading = false, error }: SignUpFormProps) {
  const [formData, setFormData] = useState({
    email: '',
    username: '',
    password: ''
  });
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  const validateEmail = (value: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(value);
  };

  const validateUsername = (value: string) => {
    return value.length >= 3 && /^[a-zA-Z0-9_-]+$/.test(value);
  };

  const validatePassword = (value: string) => {
    return value.length >= 8;
  };

  const passwordRequirements = {
    length: formData.password.length >= 8,
    hasUpperCase: /[A-Z]/.test(formData.password),
    hasLowerCase: /[a-z]/.test(formData.password),
    hasNumber: /[0-9]/.test(formData.password),
  };

  const isPasswordStrong = Object.values(passwordRequirements).filter(Boolean).length >= 3;

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setValidationErrors(prev => ({
      ...prev,
      [field]: ''
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const errors: Record<string, string> = {};

    if (!formData.email.trim()) {
      errors.email = 'Email is required';
    } else if (!validateEmail(formData.email)) {
      errors.email = 'Invalid email address';
    }

    if (!formData.username.trim()) {
      errors.username = 'Username is required';
    } else if (!validateUsername(formData.username)) {
      errors.username = 'Username must be 3+ chars, alphanumeric with _ or -';
    }

    if (!formData.password) {
      errors.password = 'Password is required';
    } else if (!validatePassword(formData.password)) {
      errors.password = 'Password must be at least 8 characters';
    } else if (!isPasswordStrong) {
      errors.password = 'Password must contain uppercase, lowercase, and numbers';
    }

    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      return;
    }

    onNext(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5 w-full">
      {/* Email Field */}
      <div className="space-y-2">
        <Label htmlFor="signup-email" className="text-sm font-medium text-gray-300">
          Email Address
        </Label>
        <div className="relative">
          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
          <Input
            id="signup-email"
            type="email"
            placeholder="you@example.com"
            value={formData.email}
            onChange={(e) => handleChange('email', e.target.value)}
            disabled={isLoading}
            className="pl-10 h-11 bg-[#1B2431] border-gray-700 text-white placeholder:text-gray-500 focus:ring-2 focus:ring-blue-500/50"
          />
        </div>
        {validationErrors.email && (
          <p className="text-red-400 text-xs flex items-center gap-1">
            <AlertCircle className="w-3 h-3" />
            {validationErrors.email}
          </p>
        )}
      </div>

      {/* Username Field */}
      <div className="space-y-2">
        <Label htmlFor="username" className="text-sm font-medium text-gray-300">
          Username
        </Label>
        <div className="relative">
          <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
          <Input
            id="username"
            type="text"
            placeholder="your_username"
            value={formData.username}
            onChange={(e) => handleChange('username', e.target.value)}
            disabled={isLoading}
            className="pl-10 h-11 bg-[#1B2431] border-gray-700 text-white placeholder:text-gray-500 focus:ring-2 focus:ring-blue-500/50"
          />
        </div>
        {validationErrors.username && (
          <p className="text-red-400 text-xs flex items-center gap-1">
            <AlertCircle className="w-3 h-3" />
            {validationErrors.username}
          </p>
        )}
      </div>

      {/* Password Field */}
      <div className="space-y-2">
        <Label htmlFor="password" className="text-sm font-medium text-gray-300">
          Password
        </Label>
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
          <Input
            id="password"
            type="password"
            placeholder="••••••••"
            value={formData.password}
            onChange={(e) => handleChange('password', e.target.value)}
            disabled={isLoading}
            className="pl-10 h-11 bg-[#1B2431] border-gray-700 text-white placeholder:text-gray-500 focus:ring-2 focus:ring-blue-500/50"
          />
        </div>

        {/* Password Requirements */}
        {formData.password && (
          <div className="space-y-1.5 mt-3 p-3 bg-gray-900/50 rounded-lg border border-gray-800">
            <PasswordRequirement met={passwordRequirements.length} text="At least 8 characters" />
            <PasswordRequirement met={passwordRequirements.hasUpperCase} text="One uppercase letter" />
            <PasswordRequirement met={passwordRequirements.hasLowerCase} text="One lowercase letter" />
            <PasswordRequirement met={passwordRequirements.hasNumber} text="One number" />
          </div>
        )}

        {validationErrors.password && (
          <p className="text-red-400 text-xs flex items-center gap-1">
            <AlertCircle className="w-3 h-3" />
            {validationErrors.password}
          </p>
        )}
      </div>

      {error && (
        <div className="flex items-center gap-2 text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-lg p-3">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          {error}
        </div>
      )}

      <Button
        type="submit"
        disabled={isLoading || !formData.email || !formData.username || !formData.password || !isPasswordStrong}
        className="w-full h-11 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-all duration-200 flex items-center justify-center gap-2"
      >
        {isLoading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Creating Account...
          </>
        ) : (
          <>
            Create Account
            <ArrowRight className="w-4 h-4" />
          </>
        )}
      </Button>

      <p className="text-xs text-gray-400 text-center">
        We'll send a verification code to your email
      </p>
    </form>
  );
}
