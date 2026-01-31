import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import {
  Check,
  X,
  Zap,
  Crown,
  Sparkles,
  Building2,
  Infinity,
  ArrowRight,
  Loader2,
  MessageSquare,
} from 'lucide-react';
import { usageService, type PlanConfiguration } from '@/services/usage.service';
import toast from 'react-hot-toast';
import { cn } from '@/lib/utils';

// ============================================
// PRICING PAGE
// Complete pricing page with 4 tiers
// ============================================

interface PlanCardProps {
  plan: {
    id: string;
    name: string;
    description: string;
    price: number;
    originalPrice?: number;
    period: string;
    isPopular?: boolean;
    isLifetime?: boolean;
    isEnterprise?: boolean;
    features: string[];
    notIncluded?: string[];
    tokensLimit: number;
    queriesLimit: number;
    connectionsLimit: number;
  };
  currentPlan?: string;
  isYearly: boolean;
  onSelect: (planId: string) => void;
  isLoading: boolean;
}

function PlanCard({ plan, currentPlan, isYearly, onSelect, isLoading }: PlanCardProps) {
  const isCurrent = currentPlan === plan.id;
  const isDowngrade = (currentPlan === 'pro' && plan.id === 'free') ||
    (currentPlan === 'lifetime' && ['free', 'pro'].includes(plan.id)) ||
    (currentPlan === 'enterprise' && ['free', 'pro', 'lifetime'].includes(plan.id));

  const getIcon = () => {
    switch (plan.id) {
      case 'free': return <Zap className="w-6 h-6" />;
      case 'pro': return <Crown className="w-6 h-6" />;
      case 'lifetime': return <Sparkles className="w-6 h-6" />;
      case 'enterprise': return <Building2 className="w-6 h-6" />;
      default: return <Zap className="w-6 h-6" />;
    }
  };

  const getButtonText = () => {
    if (isCurrent) return 'Current Plan';
    if (isDowngrade) return 'Downgrade';
    if (plan.isEnterprise) return 'Contact Sales';
    if (plan.id === 'free') return 'Get Started Free';
    return `Upgrade to ${plan.name}`;
  };

  return (
    <Card className={cn(
      'relative flex flex-col transition-all duration-300',
      plan.isPopular && 'border-primary ring-2 ring-primary/20 shadow-lg scale-[1.02]',
      isCurrent && 'border-green-500/50 bg-green-500/5'
    )}>
      {plan.isPopular && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <Badge className="bg-primary text-primary-foreground px-3 py-1">
            Most Popular
          </Badge>
        </div>
      )}

      {isCurrent && (
        <div className="absolute -top-3 right-4">
          <Badge variant="outline" className="bg-green-500/20 text-green-400 border-green-500/30">
            Current
          </Badge>
        </div>
      )}

      <CardHeader className="pb-4">
        <div className="flex items-center gap-3 mb-2">
          <div className={cn(
            'p-2 rounded-lg',
            plan.id === 'free' && 'bg-gray-500/20 text-gray-400',
            plan.id === 'pro' && 'bg-blue-500/20 text-blue-400',
            plan.id === 'lifetime' && 'bg-purple-500/20 text-purple-400',
            plan.id === 'enterprise' && 'bg-amber-500/20 text-amber-400',
          )}>
            {getIcon()}
          </div>
          <div>
            <CardTitle className="text-xl">{plan.name}</CardTitle>
          </div>
        </div>
        <CardDescription className="text-sm">{plan.description}</CardDescription>
      </CardHeader>

      <CardContent className="flex-1">
        {/* Price */}
        <div className="mb-6">
          {plan.isEnterprise ? (
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold">Custom</span>
            </div>
          ) : (
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-bold">${plan.price}</span>
              {plan.originalPrice && plan.originalPrice > plan.price && (
                <span className="text-lg text-muted-foreground line-through">${plan.originalPrice}</span>
              )}
              <span className="text-muted-foreground">
                {plan.isLifetime ? 'one-time' : `/${plan.period}`}
              </span>
            </div>
          )}
          {plan.isLifetime && (
            <p className="text-sm text-green-400 mt-1">Pay once, use forever</p>
          )}
        </div>

        {/* Limits */}
        <div className="space-y-2 mb-6 p-3 rounded-lg bg-muted/50">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">AI Tokens</span>
            <span className="font-medium">
              {plan.tokensLimit === -1 ? <Infinity className="w-4 h-4 inline" /> : plan.tokensLimit.toLocaleString()}
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Queries</span>
            <span className="font-medium">
              {plan.queriesLimit === -1 ? <Infinity className="w-4 h-4 inline" /> : plan.queriesLimit.toLocaleString()}
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Connections</span>
            <span className="font-medium">
              {plan.connectionsLimit === -1 ? <Infinity className="w-4 h-4 inline" /> : plan.connectionsLimit}
            </span>
          </div>
        </div>

        <Separator className="my-4" />

        {/* Features */}
        <ul className="space-y-3">
          {plan.features.map((feature, i) => (
            <li key={i} className="flex items-start gap-2 text-sm">
              <Check className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
              <span>{feature}</span>
            </li>
          ))}
          {plan.notIncluded?.map((feature, i) => (
            <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
              <X className="w-4 h-4 text-red-500/50 mt-0.5 shrink-0" />
              <span>{feature}</span>
            </li>
          ))}
        </ul>
      </CardContent>

      <CardFooter className="pt-4">
        <Button
          className="w-full"
          variant={plan.isPopular ? 'default' : (isCurrent ? 'outline' : 'secondary')}
          size="lg"
          disabled={isCurrent || isDowngrade || isLoading}
          onClick={() => onSelect(plan.id)}
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Processing...
            </>
          ) : (
            <>
              {getButtonText()}
              {!isCurrent && !isDowngrade && !plan.isEnterprise && (
                <ArrowRight className="w-4 h-4 ml-2" />
              )}
              {plan.isEnterprise && <MessageSquare className="w-4 h-4 ml-2" />}
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  );
}

export default function PricingPage() {
  const navigate = useNavigate();
  const [isYearly, setIsYearly] = useState(false);
  const [currentPlan, setCurrentPlan] = useState<string>('free');
  const [isLoading, setIsLoading] = useState(false);
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);

  // Fetch current plan on mount
  useEffect(() => {
    const fetchCurrentPlan = async () => {
      try {
        const result = await usageService.getSubscription();
        if (result.success && result.data) {
          setCurrentPlan(result.data.planType || 'free');
        }
      } catch (error) {
        console.error('Failed to fetch subscription:', error);
      }
    };
    fetchCurrentPlan();
  }, []);

  const plans = [
    {
      id: 'free',
      name: 'Free',
      description: 'Perfect for getting started with ChatSQL',
      price: 0,
      period: 'mo',
      tokensLimit: 10000,
      queriesLimit: 500,
      connectionsLimit: 2,
      features: [
        'Basic AI SQL generation',
        '2 database connections',
        'Query history (7 days)',
        'Community support',
      ],
      notIncluded: [
        'Priority support',
        'Advanced AI features',
        'Export to CSV/JSON',
      ],
    },
    {
      id: 'pro',
      name: 'Pro',
      description: 'For professionals who need more power',
      price: isYearly ? 100 : 10,
      originalPrice: isYearly ? 120 : undefined,
      period: isYearly ? 'year' : 'mo',
      isPopular: true,
      tokensLimit: 100000,
      queriesLimit: 5000,
      connectionsLimit: 10,
      features: [
        'Advanced AI features',
        '10 database connections',
        'Query history (90 days)',
        'Priority email support',
        'Custom saved queries',
        'Export to CSV/JSON',
        'No read-only restrictions',
      ],
    },
    {
      id: 'lifetime',
      name: 'Lifetime',
      description: 'One-time payment, lifetime access',
      price: 100,
      period: 'one-time',
      isLifetime: true,
      tokensLimit: -1,
      queriesLimit: -1,
      connectionsLimit: 50,
      features: [
        'Unlimited AI tokens',
        '50 database connections',
        'Unlimited query history',
        'Priority support',
        'All Pro features',
        'Future updates included',
        'No recurring fees',
      ],
    },
    {
      id: 'enterprise',
      name: 'Enterprise',
      description: 'For teams with advanced needs',
      price: 0,
      period: 'custom',
      isEnterprise: true,
      tokensLimit: -1,
      queriesLimit: -1,
      connectionsLimit: -1,
      features: [
        'Unlimited everything',
        'Dedicated support',
        '24/7 support',
        'Team collaboration',
        'SSO/SAML',
        'Audit logs',
        'Custom integrations',
        'SLA guarantee',
        'On-premise option',
      ],
    },
  ];

  const handleSelectPlan = async (planId: string) => {
    if (planId === 'enterprise') {
      // Navigate to contact page for enterprise
      navigate('/contact?plan=enterprise');
      return;
    }

    if (planId === 'free') {
      // Already on free, nothing to do
      toast.success('You are already on the Free plan');
      return;
    }

    // Map plan ID to checkout plan type based on billing period
    let checkoutPlanType: 'pro_monthly' | 'pro_yearly' | 'lifetime';

    if (planId === 'pro') {
      checkoutPlanType = isYearly ? 'pro_yearly' : 'pro_monthly';
    } else if (planId === 'lifetime') {
      checkoutPlanType = 'lifetime';
    } else {
      toast.error('Invalid plan selected');
      return;
    }

    // Start checkout for pro or lifetime
    setLoadingPlan(planId);
    setIsLoading(true);

    try {
      const result = await usageService.createCheckout(checkoutPlanType);

      if (result.success && result.data?.checkoutUrl) {
        // Redirect to Dodo checkout
        window.location.href = result.data.checkoutUrl;
      } else {
        toast.error(result.message || 'Failed to create checkout session');
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to start checkout');
    } finally {
      setIsLoading(false);
      setLoadingPlan(null);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-16">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-12">
          <Badge variant="outline" className="mb-4">Pricing</Badge>
          <h1 className="text-4xl font-bold mb-4">
            Choose the plan that's right for you
          </h1>
          <p className="text-xl text-muted-foreground mb-8">
            Start free and upgrade as you grow. All plans include core features.
          </p>

          {/* Billing Toggle */}
          <div className="flex items-center justify-center gap-4">
            <span className={cn('text-sm', !isYearly && 'text-foreground font-medium')}>
              Monthly
            </span>
            <Switch
              checked={isYearly}
              onCheckedChange={setIsYearly}
            />
            <span className={cn('text-sm', isYearly && 'text-foreground font-medium')}>
              Yearly
              <Badge variant="secondary" className="ml-2 text-xs">
                Save 17%
              </Badge>
            </span>
          </div>
        </div>

        {/* Plan Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto">
          {plans.map((plan) => (
            <PlanCard
              key={plan.id}
              plan={plan}
              currentPlan={currentPlan}
              isYearly={isYearly}
              onSelect={handleSelectPlan}
              isLoading={isLoading && loadingPlan === plan.id}
            />
          ))}
        </div>

        {/* FAQ or Additional Info */}
        <div className="mt-16 text-center">
          <h2 className="text-2xl font-bold mb-4">Questions?</h2>
          <p className="text-muted-foreground mb-4">
            Need help choosing? Have questions about features?
          </p>
          <Button variant="outline" onClick={() => navigate('/contact')}>
            <MessageSquare className="w-4 h-4 mr-2" />
            Contact Us
          </Button>
        </div>

        {/* Guarantee */}
        <div className="mt-12 p-6 rounded-lg bg-muted/50 max-w-2xl mx-auto text-center">
          <h3 className="font-semibold mb-2">💯 30-Day Money-Back Guarantee</h3>
          <p className="text-sm text-muted-foreground">
            Not satisfied? Get a full refund within 30 days, no questions asked.
            We're confident you'll love ChatSQL.
          </p>
        </div>
      </div>
    </div>
  );
}
