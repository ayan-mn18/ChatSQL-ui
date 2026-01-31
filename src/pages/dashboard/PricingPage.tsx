import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
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
  ShieldCheck,
  CreditCard,
  CircleDollarSign
} from 'lucide-react';
import { usageService } from '@/services/usage.service';
import toast from 'react-hot-toast';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

// ============================================
// MOTION COMPONENTS
// ============================================
const MotionCard = motion.create(Card);
const MotionDiv = motion.div;

// ============================================
// PRICING PAGE
// Improved modern aesthetics
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
    color: string;
  };
  currentPlan?: string;
  isYearly: boolean;
  onSelect: (planId: string) => void;
  isLoading: boolean;
  index: number;
}

function PlanCard({ plan, currentPlan, isYearly, onSelect, isLoading, index }: PlanCardProps) {
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
    <MotionCard
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.1 }}
      className={cn(
        'relative flex flex-col transition-all duration-300 backdrop-blur-xl border-slate-800 h-full',
        plan.isPopular
          ? 'bg-slate-900/40 border-indigo-500/50 ring-1 ring-indigo-500/30 shadow-2xl shadow-indigo-500/10 z-10 scale-100 md:scale-105'
          : 'bg-slate-900/30 hover:border-slate-700 hover:bg-slate-900/50 hover:shadow-xl hover:-translate-y-1',
        isCurrent && 'border-emerald-500/50 bg-emerald-900/10'
      )}
    >
      {plan.isPopular && (
        <div className="absolute -top-4 left-1/2 -translate-x-1/2 z-20">
          <Badge className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white border-0 px-4 py-1.5 shadow-lg shadow-indigo-500/40">
            Most Popular
          </Badge>
        </div>
      )}

      {isCurrent && (
        <div className="absolute top-4 right-4 animate-pulse">
          <Badge variant="outline" className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 shadow-lg shadow-emerald-500/10">
            Active Plan
          </Badge>
        </div>
      )}

      <div className={cn("absolute inset-x-0 top-0 h-1 bg-gradient-to-r", plan.color)} />

      <CardHeader className="pb-4 pt-10">
        <div className="flex items-center gap-3 mb-4">
          <div className={cn(
            'p-3 rounded-2xl shadow-inner border border-white/5',
            plan.id === 'free' && 'bg-slate-800 text-slate-400',
            plan.id === 'pro' && 'bg-indigo-500/20 text-indigo-400 border-indigo-500/20',
            plan.id === 'lifetime' && 'bg-emerald-500/20 text-emerald-400 border-emerald-500/20',
            plan.id === 'enterprise' && 'bg-amber-500/20 text-amber-400 border-amber-500/20',
          )}>
            {getIcon()}
          </div>
          <div>
            <CardTitle className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">
              {plan.name}
            </CardTitle>
          </div>
        </div>
        <CardDescription className="text-slate-400 text-sm h-10 line-clamp-2">
          {plan.description}
        </CardDescription>
      </CardHeader>

      <CardContent className="flex-1">
        {/* Price */}
        <div className="mb-8 p-4 bg-slate-950/30 rounded-xl border border-white/5">
          {plan.isEnterprise ? (
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold text-white">Custom</span>
            </div>
          ) : (
            <div className="flex flex-col">
              <div className="flex items-baseline gap-1">
                <span className="text-4xl font-bold text-white">${plan.price}</span>
                {plan.originalPrice && plan.originalPrice > plan.price && (
                  <span className="text-lg text-slate-500 line-through ml-2">${plan.originalPrice}</span>
                )}
                <span className="text-slate-400 ml-1">
                  {plan.isLifetime ? 'one-time' : `/${plan.period}`}
                </span>
              </div>
              {isYearly && !plan.isLifetime && (
                <p className="text-xs text-emerald-400 mt-2 font-medium">Billed yearly (save 17%)</p>
              )}
            </div>
          )}
          {plan.isLifetime && (
            <p className="text-xs text-emerald-400 mt-2 font-medium flex items-center gap-1">
              <ShieldCheck className="w-3 h-3" /> Pay once, own forever
            </p>
          )}
        </div>

        {/* Limits */}
        <div className="space-y-3 mb-8">
          <div className="flex justify-between items-center text-sm p-2 rounded-lg hover:bg-white/5 transition-colors">
            <span className="text-slate-400 flex items-center gap-2">
              <Zap className="w-4 h-4 text-indigo-400" /> AI Tokens
            </span>
            <span className="font-semibold text-white">
              {plan.tokensLimit === -1 ? <span className="flex items-center gap-1 text-emerald-400"><Infinity className="w-3 h-3" /> Unlimited</span> : plan.tokensLimit.toLocaleString()}
            </span>
          </div>
          <div className="flex justify-between items-center text-sm p-2 rounded-lg hover:bg-white/5 transition-colors">
            <span className="text-slate-400 flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-cyan-400" /> Queries
            </span>
            <span className="font-semibold text-white">
              {plan.queriesLimit === -1 ? <span className="flex items-center gap-1 text-emerald-400"><Infinity className="w-3 h-3" /> Unlimited</span> : plan.queriesLimit.toLocaleString()}
            </span>
          </div>
          <div className="flex justify-between items-center text-sm p-2 rounded-lg hover:bg-white/5 transition-colors">
            <span className="text-slate-400 flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-pink-400" /> Connections
            </span>
            <span className="font-semibold text-white">
              {plan.connectionsLimit === -1 ? <span className="flex items-center gap-1 text-emerald-400"><Infinity className="w-3 h-3" /> Unlimited</span> : plan.connectionsLimit}
            </span>
          </div>
        </div>

        <Separator className="my-6 bg-slate-800" />

        {/* Features */}
        <ul className="space-y-3">
          {plan.features.map((feature, i) => (
            <li key={i} className="flex items-start gap-3 text-sm">
              <div className="mt-0.5 p-0.5 rounded-full bg-emerald-500/10 shrink-0">
                <Check className="w-3.5 h-3.5 text-emerald-500" />
              </div>
              <span className="text-slate-300">{feature}</span>
            </li>
          ))}
          {plan.notIncluded?.map((feature, i) => (
            <li key={i} className="flex items-start gap-3 text-sm text-slate-500">
              <div className="mt-0.5 p-0.5 rounded-full bg-slate-800 shrink-0">
                <X className="w-3.5 h-3.5 text-slate-600" />
              </div>
              <span className="line-through opacity-70">{feature}</span>
            </li>
          ))}
        </ul>
      </CardContent>

      <CardFooter className="pt-8 pb-8">
        <Button
          className={cn(
            "w-full h-12 rounded-xl text-sm font-semibold transition-all duration-300 shadow-lg",
            plan.isPopular
              ? "bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white shadow-indigo-500/25 border-0"
              : isCurrent
                ? "bg-slate-800 text-slate-400 cursor-not-allowed border border-slate-700"
                : "bg-white text-slate-900 hover:bg-slate-200 border-0"
          )}
          variant={plan.isPopular ? 'default' : (isCurrent ? 'outline' : 'secondary')}
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
    </MotionCard>
  );
}

export default function PricingPage() {
  const { user } = useAuth();
  const [isYearly, setIsYearly] = useState(true);
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);

  const plans = [
    {
      id: 'free',
      name: 'Free',
      description: 'Perfect for trying out ChatSQL',
      price: 0,
      period: 'month',
      tokensLimit: 50000,
      queriesLimit: 100,
      connectionsLimit: 1,
      features: [
        '50k AI tokens / month',
        '100 queries / month',
        '1 Database connection',
        'Basic query generation',
        'Standard support'
      ],
      notIncluded: [
        'Advanced visualizations',
        'Query optimization',
        'Data export',
        'Team collaboration'
      ],
      color: "from-slate-500 to-slate-400"
    },
    {
      id: 'pro',
      name: 'Pro',
      description: 'For professionals and small teams',
      price: isYearly ? 29 : 35,
      originalPrice: isYearly ? 35 : undefined,
      period: 'month',
      tokensLimit: 500000,
      queriesLimit: 2000,
      connectionsLimit: 5,
      isPopular: true,
      features: [
        '500k AI tokens / month',
        '2,000 queries / month',
        '5 Database connections',
        'Advanced visualizations',
        'Query optimization',
        'CSV/Excel export',
        'Priority support'
      ],
      color: "from-indigo-500 to-purple-500"
    },
    {
      id: 'lifetime',
      name: 'Lifetime',
      description: 'One-time payment, forever access',
      price: 499,
      originalPrice: 999,
      period: 'one-time',
      tokensLimit: -1,
      queriesLimit: -1,
      connectionsLimit: 20,
      isLifetime: true,
      features: [
        'Unlimited AI tokens',
        'Unlimited queries',
        '20 Database connections',
        'All Pro features included',
        'Early access to new features',
        'Lifetime updates',
        'Dedicated support channel'
      ],
      color: "from-emerald-500 to-teal-400"
    },
    {
      id: 'enterprise',
      name: 'Enterprise',
      description: 'Custom solutions for large organizations',
      price: 0,
      period: 'custom',
      tokensLimit: -1,
      queriesLimit: -1,
      connectionsLimit: -1,
      isEnterprise: true,
      features: [
        'Unlimited everything',
        'Custom AI model fine-tuning',
        'SLA & 99.9% Uptime',
        'SSO & Advanced Security',
        'On-premise deployment option',
        'Dedicated Account Manager',
        'Custom integrations'
      ],
      color: "from-amber-500 to-orange-400"
    }
  ];

  const handleSelectPlan = async (planId: string) => {
    if (planId === 'enterprise') {
      window.location.href = 'mailto:sales@chatsql.com';
      return;
    }

    if (planId === 'free') {
      toast.success("You are already on the Free plan");
      return;
    }

    setLoadingPlan(planId);

    try {
      let checkoutPlanType: 'pro_monthly' | 'pro_yearly' | 'lifetime';

      if (planId === 'pro') {
        checkoutPlanType = isYearly ? 'pro_yearly' : 'pro_monthly';
      } else if (planId === 'lifetime') {
        checkoutPlanType = 'lifetime';
      } else {
        throw new Error('Invalid plan selected');
      }

      const result = await usageService.createCheckout(checkoutPlanType);

      if (result.success && result.data?.checkoutUrl) {
        window.location.href = result.data.checkoutUrl;
      } else {
        toast.error(result.message || 'Failed to create checkout session');
      }
    } catch (error) {
      toast.error('Failed to start checkout process');
      console.error(error);
    } finally {
      setLoadingPlan(null);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50 pb-20 overflow-x-hidden relative">
      {/* Background Effects */}
      <div className="absolute top-0 left-0 w-full h-[500px] bg-gradient-to-b from-indigo-900/10 via-slate-950/50 to-slate-950 pointer-events-none" />
      <div className="fixed top-[20%] right-[-10%] w-[500px] h-[500px] bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="fixed bottom-[20%] left-[-10%] w-[500px] h-[500px] bg-emerald-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 md:px-8 relative z-10 pt-10">
        <div className="text-center mb-16 space-y-6">
          <MotionDiv
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h2 className="text-sm font-semibold tracking-wider text-indigo-400 uppercase mb-2">Pricing Plans</h2>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white via-slate-200 to-slate-400 mb-6">
              Simple, Transparent Pricing
            </h1>
          </MotionDiv>

          <MotionDiv
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="text-xl text-slate-400 max-w-2xl mx-auto"
          >
            Start for free, scale as you grow. Choose the plan that best fits your needs.
            Upgrade or cancel at any time.
          </MotionDiv>

          <MotionDiv
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.5 }}
            className="flex items-center justify-center gap-4 mt-8"
          >
            <span className={cn("text-sm transition-colors", !isYearly ? "text-white font-medium" : "text-slate-400")}>
              Monthly
            </span>
            <Switch
              checked={isYearly}
              onCheckedChange={setIsYearly}
              className="data-[state=checked]:bg-indigo-600"
            />
            <span className={cn("text-sm transition-colors flex items-center gap-2", isYearly ? "text-white font-medium" : "text-slate-400")}>
              Yearly
              <Badge variant="secondary" className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 text-[10px] px-1.5 py-0.5 h-5">
                Save 20%
              </Badge>
            </span>
          </MotionDiv>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-8 max-w-7xl mx-auto items-start">
          {plans.map((plan, idx) => (
            <PlanCard
              key={plan.id}
              plan={plan}
              currentPlan={user?.plan || 'free'}
              isYearly={isYearly}
              onSelect={handleSelectPlan}
              isLoading={loadingPlan === plan.id}
              color={plan.color!}
              index={idx}
            />
          ))}
        </div>

        <div className="mt-20 text-center">
          <h3 className="text-lg font-medium text-white mb-4">Trusted by data teams at</h3>
          <div className="flex flex-wrap justify-center gap-8 md:gap-16 opacity-50 grayscale hover:grayscale-0 transition-all duration-500">
            {/* Placeholders for logos */}
            <div className="text-xl font-bold text-slate-400">ACME Corp</div>
            <div className="text-xl font-bold text-slate-400">DataFlow</div>
            <div className="text-xl font-bold text-slate-400">StreamLine</div>
            <div className="text-xl font-bold text-slate-400">TechSpace</div>
            <div className="text-xl font-bold text-slate-400">GlobalSoft</div>
          </div>
        </div>

        {/* FAQ Section could go here */}
      </div>
    </div>
  );
}
