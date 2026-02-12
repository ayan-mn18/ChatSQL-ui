import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { SignUpForm } from './SignUpForm';
import { OTPVerification } from './OTPVerification';
import { toast } from 'react-hot-toast';

type AuthStep = 'signup' | 'otp';

interface SignUpData {
  email: string;
  username: string;
  password: string;
}

export default function SignUpPage() {
  const navigate = useNavigate();
  const { isAuthenticated, register, verifyEmail, resendOTP, isLoading, error, clearError } = useAuth();
  const [step, setStep] = useState<AuthStep>('signup');
  const [signupData, setSignupData] = useState<SignUpData>({ email: '', username: '', password: '' });
  const [isResending, setIsResending] = useState(false);

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard');
    }
  }, [isAuthenticated, navigate]);

  const handleSignUpSubmit = async (data: SignUpData) => {
    try {
      await register(data);
      setSignupData(data);
      setStep('otp');
      toast.success('Account created! Please check your email for the verification code.');
    } catch {
      // Error is handled by context
    }
  };

  const handleOTPVerify = async (otp: string) => {
    try {
      await verifyEmail({ email: signupData.email, otp });
      navigate('/dashboard');
    } catch {
      // Error is handled by context
    }
  };

  const handleResendOTP = async () => {
    setIsResending(true);
    try {
      await resendOTP(signupData.email);
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
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>
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
              <h1 className="text-3xl font-bold text-white">Create Your Account</h1>
              <p className="text-gray-400">
                {step === 'signup'
                  ? 'Join ChatSQL to start querying your databases'
                  : 'Verify your email address'}
              </p>
            </div>
          </div>

          {/* Auth Container */}
          <div className="bg-[#1B2431]/40 backdrop-blur-xl border border-gray-800 rounded-2xl p-8 shadow-2xl">
            {step === 'signup' && (
              <SignUpForm
                onNext={handleSignUpSubmit}
                isLoading={isLoading}
                error={error || ''}
              />
            )}

            {step === 'otp' && (
              <>
                <OTPVerification
                  email={signupData.email}
                  onVerify={handleOTPVerify}
                  onResend={handleResendOTP}
                  isLoading={isLoading}
                  isResending={isResending}
                  error={error || ''}
                />
                <button
                  onClick={() => {
                    setStep('signup');
                    clearError();
                  }}
                  className="w-full mt-4 text-sm text-gray-400 hover:text-white transition-colors"
                >
                  Back to Sign Up
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
