import { useState } from 'react';
import { Mail, ArrowRight, Loader2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface SignInFormProps {
  onNext: (email: string) => void;
  isLoading?: boolean;
  error?: string;
}

export function SignInForm({ onNext, isLoading = false, error }: SignInFormProps) {
  const [email, setEmail] = useState('');
  const [validationError, setValidationError] = useState('');

  const validateEmail = (value: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(value);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError('');

    if (!email.trim()) {
      setValidationError('Please enter your email');
      return;
    }

    if (!validateEmail(email)) {
      setValidationError('Please enter a valid email address');
      return;
    }

    onNext(email);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 w-full">
      <div className="space-y-3">
        <Label htmlFor="email" className="text-sm font-medium text-gray-300">
          Email Address
        </Label>
        <div className="relative">
          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
          <Input
            id="email"
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              setValidationError('');
            }}
            disabled={isLoading}
            className="pl-10 h-12 bg-[#1B2431] border-gray-700 text-white placeholder:text-gray-500 focus:ring-2 focus:ring-blue-500/50"
          />
        </div>
        {validationError && (
          <div className="flex items-center gap-2 text-red-400 text-sm">
            <AlertCircle className="w-4 h-4" />
            {validationError}
          </div>
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
        disabled={isLoading || !email.trim()}
        className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-all duration-200 flex items-center justify-center gap-2"
      >
        {isLoading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Sending OTP...
          </>
        ) : (
          <>
            Continue
            <ArrowRight className="w-4 h-4" />
          </>
        )}
      </Button>

      <p className="text-sm text-gray-400 text-center">
        We'll send you a verification code via email
      </p>
    </form>
  );
}
