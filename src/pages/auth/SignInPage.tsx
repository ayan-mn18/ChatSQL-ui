import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { SignInForm } from './SignInForm';
import { OTPVerification } from './OTPVerification';

type AuthStep = 'signin' | 'otp';

export default function SignInPage() {
  const navigate = useNavigate();
  const { isAuthenticated, signIn, verifyOTP, resendOTP, isLoading, error, setError, resendCooldown } = useAuth();
  const [step, setStep] = useState<AuthStep>('signin');
  const [email, setEmail] = useState('');
  const [isResending, setIsResending] = useState(false);

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard');
    }
  }, [isAuthenticated, navigate]);

  const handleSignInSubmit = async (userEmail: string) => {
    try {
      await signIn(userEmail);
      setEmail(userEmail);
      setStep('otp');
    } catch {
      // Error is handled by context
    }
  };

  const handleOTPVerify = async () => {
    try {
      await verifyOTP();
      navigate('/dashboard');
    } catch {
      // Error is handled by context
    }
  };

  const handleResendOTP = async () => {
    setIsResending(true);
    try {
      await resendOTP();
    } catch {
      // Error is handled by context
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#020817] text-white flex items-center justify-center px-4 py-12">
      {/* Background Grid */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] bg-blue-500/20 blur-[120px] rounded-full opacity-50"></div>
      </div>

      <div className="w-full max-w-md relative z-10">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-2 text-gray-400 hover:text-gray-300 transition-colors mb-6"
          >
            <ChevronLeft className="w-5 h-5" />
            Back to Home
          </button>

          <div className="space-y-2">
            <h1 className="text-3xl font-bold text-white">Sign In to ChatSQL</h1>
            <p className="text-gray-400">
              {step === 'signin'
                ? 'Enter your email to continue'
                : 'Check your email for the verification code'}
            </p>
          </div>
        </div>

        {/* Auth Container */}
        <div className="bg-[#1B2431]/40 backdrop-blur-xl border border-gray-800 rounded-2xl p-8 shadow-2xl">
          {step === 'signin' && (
            <SignInForm
              onNext={handleSignInSubmit}
              isLoading={isLoading}
              error={error || ''}
            />
          )}

          {step === 'otp' && (
            <>
              <OTPVerification
                email={email}
                onVerify={handleOTPVerify}
                onResend={handleResendOTP}
                isLoading={isLoading}
                isResending={isResending}
                error={error || ''}
                resendCooldown={resendCooldown}
              />

              <button
                onClick={() => {
                  setStep('signin');
                  setEmail('');
                  setError(null);
                }}
                className="w-full text-center text-sm text-gray-400 hover:text-gray-300 transition-colors mt-6"
              >
                Use a different email
              </button>
            </>
          )}
        </div>

        {/* Footer */}
        <p className="text-center text-sm text-gray-500 mt-6">
          Don't have an account?{' '}
          <button
            onClick={() => navigate('/auth/signup')}
            className="text-blue-400 hover:text-blue-300 font-medium transition-colors"
          >
            Sign Up
          </button>
        </p>
      </div>
    </div>
  );
}