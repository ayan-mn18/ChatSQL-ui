import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { SignInForm } from './SignInForm';
import { OTPVerification } from './OTPVerification';
import { toast } from 'react-hot-toast';

type AuthStep = 'signin' | 'otp';

export default function SignInPage() {
  const navigate = useNavigate();
  const { isAuthenticated, login, verifyEmail, resendOTP, isLoading, error, clearError } = useAuth();
  const [step, setStep] = useState<AuthStep>('signin');
  const [email, setEmail] = useState('');
  const [isResending, setIsResending] = useState(false);

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard');
    }
  }, [isAuthenticated, navigate]);

  const handleSignInSubmit = async (userEmail: string, password: string) => {
    try {
      await login({ email: userEmail, password });
      navigate('/dashboard');
    } catch (err: any) {
      if (err.response?.data?.code === 'EMAIL_NOT_VERIFIED') {
        setEmail(userEmail);
        setStep('otp');
        clearError();
        toast.error('Please verify your email to continue.');
        // Trigger resend OTP so they have a fresh code
        try {
          await resendOTP(userEmail);
        } catch {
          // Ignore resend error, maybe they just need to enter the code they already have
        }
      }
    }
  };

  const handleOTPVerify = async (otp: string) => {
    try {
      await verifyEmail({ email, otp });
      navigate('/dashboard');
    } catch {
      // Error is handled by context
    }
  };

  const handleResendOTP = async () => {
    setIsResending(true);
    try {
      await resendOTP(email);
    } catch {
      // Error is handled by context
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#020817] text-white flex flex-col">
      {/* Background Grid */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear_gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] bg-blue-500/20 blur-[120px] rounded-full opacity-50"></div>
      </div>
      <div className="flex-1 flex items-center justify-center px-4 py-12">

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
                  ? 'Enter your email and password to continue'
                  : 'Check your email for the verification code'}
              </p>
            </div>
          </div>

          {/* Auth Container */}
          <div className="bg-[#1B2431]/40 backdrop-blur-xl border border-gray-800 rounded-2xl p-8 shadow-2xl">
            {step === 'signin' && (
              <SignInForm
                onLogin={handleSignInSubmit}
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
                />
                <button
                  onClick={() => {
                    setStep('signin');
                    clearError();
                  }}
                  className="w-full mt-4 text-sm text-gray-400 hover:text-white transition-colors"
                >
                  Back to Sign In
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
