import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Mail, Loader2 } from 'lucide-react';
import { authService } from '@/services/auth.service';
import { toast } from 'react-hot-toast';

export default function ForgotPasswordPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      await authService.forgotPassword({ email });
      setIsSubmitted(true);
      toast.success('Password reset email sent!');
    } catch (err: any) {
      const errorMessage = err.response?.data?.error || 'Failed to send reset email. Please try again.';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
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
            onClick={() => navigate('/auth/signin')}
            className="flex items-center gap-2 text-gray-400 hover:text-gray-300 transition-colors mb-6"
          >
            <ChevronLeft className="w-5 h-5" />
            Back to Sign In
          </button>

          <div className="space-y-2">
            <h1 className="text-3xl font-bold text-white">Reset Password</h1>
            <p className="text-gray-400">
              Enter your email to receive a password reset link
            </p>
          </div>
        </div>

        {/* Form Container */}
        <div className="bg-[#1B2431]/40 backdrop-blur-xl border border-gray-800 rounded-2xl p-8 shadow-2xl">
          {isSubmitted ? (
            <div className="text-center space-y-6">
              <div className="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center mx-auto">
                <Mail className="w-8 h-8 text-green-500" />
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-semibold text-white">Check your email</h3>
                <p className="text-gray-400">
                  We've sent a password reset link to <span className="text-white font-medium">{email}</span>
                </p>
              </div>
              <button
                onClick={() => navigate('/auth/signin')}
                className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl transition-all duration-200"
              >
                Return to Sign In
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm">
                  {error}
                </div>
              )}

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-300">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-[#0B1120] border border-gray-800 rounded-xl py-3 pl-10 pr-4 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all"
                    placeholder="name@example.com"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-600/50 disabled:cursor-not-allowed text-white font-medium rounded-xl transition-all duration-200 flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Sending Link...
                  </>
                ) : (
                  'Send Reset Link'
                )}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
