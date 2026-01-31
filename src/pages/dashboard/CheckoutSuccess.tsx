import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, Sparkles, ArrowRight, Loader2 } from 'lucide-react';
import confetti from 'canvas-confetti';

// ============================================
// CHECKOUT SUCCESS PAGE
// Shown after successful payment
// ============================================

export function CheckoutSuccess() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const plan = searchParams.get('plan') || 'pro';
  const [countdown, setCountdown] = useState(5);

  useEffect(() => {
    // Trigger confetti
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 }
    });

    // Auto-redirect countdown
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          navigate('/dashboard/usage');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [navigate]);

  const getPlanName = () => {
    switch (plan) {
      case 'pro': return 'Pro';
      case 'lifetime': return 'Lifetime';
      default: return plan;
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="max-w-md w-full">
        <CardContent className="pt-10 pb-8 text-center">
          {/* Success Icon */}
          <div className="relative mb-6">
            <div className="w-20 h-20 mx-auto bg-green-500/20 rounded-full flex items-center justify-center">
              <CheckCircle className="w-10 h-10 text-green-500" />
            </div>
            <div className="absolute -top-2 -right-2 w-8 h-8 bg-purple-500/20 rounded-full flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-purple-400" />
            </div>
          </div>

          {/* Message */}
          <h1 className="text-2xl font-bold mb-2">Payment Successful! 🎉</h1>
          <p className="text-muted-foreground mb-6">
            Welcome to the <span className="font-semibold text-foreground">{getPlanName()}</span> plan!
            Your account has been upgraded.
          </p>

          {/* Features unlocked */}
          <div className="bg-muted/50 rounded-lg p-4 mb-6 text-left">
            <p className="text-sm font-medium mb-2">You now have access to:</p>
            <ul className="text-sm text-muted-foreground space-y-1">
              {plan === 'lifetime' ? (
                <>
                  <li>✓ Unlimited AI tokens</li>
                  <li>✓ 50 database connections</li>
                  <li>✓ Unlimited query history</li>
                  <li>✓ Priority support</li>
                  <li>✓ Lifetime updates</li>
                </>
              ) : (
                <>
                  <li>✓ 100,000 AI tokens/month</li>
                  <li>✓ 10 database connections</li>
                  <li>✓ 90-day query history</li>
                  <li>✓ Priority support</li>
                  <li>✓ Export to CSV/JSON</li>
                </>
              )}
            </ul>
          </div>

          {/* Actions */}
          <div className="space-y-3">
            <Button onClick={() => navigate('/dashboard/usage')} className="w-full">
              Go to Dashboard
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
            <p className="text-xs text-muted-foreground">
              Redirecting in {countdown} seconds...
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ============================================
// CHECKOUT CANCELLED PAGE
// Shown when user cancels checkout
// ============================================

export function CheckoutCancelled() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="max-w-md w-full">
        <CardContent className="pt-10 pb-8 text-center">
          {/* Icon */}
          <div className="w-16 h-16 mx-auto bg-muted rounded-full flex items-center justify-center mb-6">
            <Loader2 className="w-8 h-8 text-muted-foreground" />
          </div>

          {/* Message */}
          <h1 className="text-2xl font-bold mb-2">Checkout Cancelled</h1>
          <p className="text-muted-foreground mb-6">
            No worries! Your checkout was cancelled and you haven't been charged.
          </p>

          {/* Actions */}
          <div className="space-y-3">
            <Button onClick={() => navigate('/dashboard/pricing')} variant="outline" className="w-full">
              View Plans
            </Button>
            <Button onClick={() => navigate('/dashboard')} className="w-full">
              Back to Dashboard
            </Button>
          </div>

          {/* Help */}
          <p className="text-xs text-muted-foreground mt-6">
            Having issues? <a href="/contact" className="text-primary hover:underline">Contact support</a>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
