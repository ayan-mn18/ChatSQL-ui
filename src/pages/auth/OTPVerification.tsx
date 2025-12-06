import { useState } from 'react';
import { Mail, Loader2, AlertCircle, ArrowRight, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp"
import { Label } from '@/components/ui/label';

interface OTPVerificationProps {
  email: string;
  onVerify: (otp: string) => void;
  onResend: () => void;
  isLoading?: boolean;
  isResending?: boolean;
  error?: string;
  resendCooldown?: number;
}

export function OTPVerification({
  email,
  onVerify,
  onResend,
  isLoading = false,
  isResending = false,
  error,
  resendCooldown = 0
}: OTPVerificationProps) {
  const [otp, setOtp] = useState('');
  const [validationError, setValidationError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError('');

    if (!otp.trim()) {
      setValidationError('Please enter the verification code');
      return;
    }

    if (otp.length < 6) {
      setValidationError('Verification code should be 6 digits');
      return;
    }

    onVerify(otp);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 w-full">
      <div className="space-y-2 text-center">
        <div className="inline-flex items-center justify-center w-12 h-12 bg-blue-500/10 rounded-full mb-3">
          <Mail className="w-6 h-6 text-blue-400" />
        </div>
        <h3 className="text-lg font-semibold text-white">Verify Your Email</h3>
        <p className="text-sm text-gray-400">
          We sent a 6-digit code to <br />
          <span className="font-medium text-gray-300">{email}</span>
        </p>
      </div>

      <div className="space-y-3">
        <Label htmlFor="otp" className="text-sm font-medium text-gray-300">
          Verification Code
        </Label>
        <div className="flex justify-center py-2">
          <InputOTP
            maxLength={6}
            value={otp}
            onChange={(value) => {
              setOtp(value);
              setValidationError('');
            }}
            disabled={isLoading}
          >
            <InputOTPGroup className="gap-2">
              <InputOTPSlot index={0} className="bg-[#1B2431] border-gray-700 text-white h-12 w-12 text-lg" />
              <InputOTPSlot index={1} className="bg-[#1B2431] border-gray-700 text-white h-12 w-12 text-lg" />
              <InputOTPSlot index={2} className="bg-[#1B2431] border-gray-700 text-white h-12 w-12 text-lg" />
              <InputOTPSlot index={3} className="bg-[#1B2431] border-gray-700 text-white h-12 w-12 text-lg" />
              <InputOTPSlot index={4} className="bg-[#1B2431] border-gray-700 text-white h-12 w-12 text-lg" />
              <InputOTPSlot index={5} className="bg-[#1B2431] border-gray-700 text-white h-12 w-12 text-lg" />
            </InputOTPGroup>
          </InputOTP>
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
        disabled={isLoading || otp.length < 6}
        className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-all duration-200 flex items-center justify-center gap-2"
      >
        {isLoading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Verifying...
          </>
        ) : (
          <>
            Verify Email
            <ArrowRight className="w-4 h-4" />
          </>
        )}
      </Button>

      <div className="flex items-center justify-between pt-4 border-t border-gray-800">
        <p className="text-sm text-gray-400">Didn't receive the code?</p>
        <Button
          type="button"
          onClick={onResend}
          disabled={isResending || resendCooldown > 0}
          variant="ghost"
          className="text-blue-400 hover:text-blue-300 hover:bg-blue-500/10 text-sm font-medium flex items-center gap-1 p-0 h-auto"
        >
          <RotateCcw className="w-4 h-4" />
          {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend Code'}
        </Button>
      </div>
    </form>
  );
}
