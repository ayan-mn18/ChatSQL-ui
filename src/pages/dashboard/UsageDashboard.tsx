import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  BarElement,
  Filler,
  ArcElement,
} from 'chart.js';
import { Line, Doughnut, Bar } from 'react-chartjs-2';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress.tsx';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Zap,
  Database,
  MessageSquare,
  Crown,
  Clock,
  TrendingUp,
  RefreshCw,
  Sparkles,
  CircleDollarSign,
  ArrowUpRight,
  CheckCircle2,
  Infinity,
  Calendar,
  Activity,
  Brain,
  Code2,
  AlertCircle,
  BarChart3,
  PieChart
} from 'lucide-react';
import { usageService, type UsageDashboardData, type PlanConfiguration } from '@/services/usage.service';
import toast from 'react-hot-toast';
import { cn } from '@/lib/utils';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  BarElement,
  Filler,
  ArcElement
);

// ============================================
// HELPER: Format numbers
// ============================================
const formatNumber = (num: number): string => {
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
  return num.toString();
};

// ============================================
// COMPONENT: Plan Badge
// ============================================
function PlanBadge({ planType }: { planType: string }) {
  const config = {
    free: { label: 'Free', className: 'bg-slate-500/20 text-slate-400 border-slate-500/30' },
    pro: { label: 'Pro', className: 'bg-violet-500/20 text-violet-300 border-violet-500/30' },
    pro_monthly: { label: 'Pro Monthly', className: 'bg-violet-500/20 text-violet-300 border-violet-500/30' },
    pro_yearly: { label: 'Pro Yearly', className: 'bg-amber-500/20 text-amber-300 border-amber-500/30' },
    lifetime: { label: 'Lifetime', className: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' },
    enterprise: { label: 'Enterprise', className: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30' },
  }[planType] || { label: planType, className: 'bg-slate-500/20 text-slate-400 border-slate-500/30' };

  return (
    <Badge variant="outline" className={cn('text-xs font-semibold px-2 py-0.5', config.className)}>
      {planType.includes('pro') && <Crown className="w-3 h-3 mr-1.5" />}
      {planType === 'enterprise' && <Sparkles className="w-3 h-3 mr-1.5" />}
      {planType === 'lifetime' && <Infinity className="w-3 h-3 mr-1.5" />}
      {config.label}
    </Badge>
  );
}

// ============================================
// COMPONENT: Usage Limit Card (Revamped)
// ============================================
function UsageLimitCard({
  title,
  icon: Icon,
  used,
  limit,
  isUnlimited,
  color,
  subtitle,
  delay = 0
}: {
  title: string;
  icon: React.ElementType;
  used: number;
  limit: number;
  isUnlimited: boolean;
  color: 'violet' | 'cyan' | 'emerald' | 'amber' | 'rose' | 'blue';
  subtitle?: string;
  delay?: number;
}) {
  const percentage = isUnlimited ? 0 : Math.min(100, Math.round((used / limit) * 100));
  const isWarning = percentage >= 80 && percentage < 100;
  const isDanger = percentage >= 100;

  const colorStyles = {
    violet: { bg: 'bg-violet-500/10', text: 'text-violet-400', bar: 'bg-violet-500' },
    cyan: { bg: 'bg-cyan-500/10', text: 'text-cyan-400', bar: 'bg-cyan-500' },
    emerald: { bg: 'bg-emerald-500/10', text: 'text-emerald-400', bar: 'bg-emerald-500' },
    amber: { bg: 'bg-amber-500/10', text: 'text-amber-400', bar: 'bg-amber-500' },
    rose: { bg: 'bg-rose-500/10', text: 'text-rose-400', bar: 'bg-rose-500' },
    blue: { bg: 'bg-blue-500/10', text: 'text-blue-400', bar: 'bg-blue-500' },
  }[color];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4 }}
    >
      <Card className="bg-slate-900/50 border-slate-800 backdrop-blur-sm overflow-hidden relative group">
        <div className={cn("absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity duration-700 bg-gradient-to-br",
          color === 'violet' ? "from-violet-500 to-transparent" :
            color === 'cyan' ? "from-cyan-500 to-transparent" :
              "from-blue-500 to-transparent"
        )} />

        <CardContent className="p-6 relative z-10">
          <div className="flex justify-between items-start mb-4">
            <div className={cn("p-3 rounded-xl", colorStyles.bg)}>
              <Icon className={cn("w-6 h-6", colorStyles.text)} />
            </div>
            {!isUnlimited && (
              <Badge variant="outline" className={cn(
                "font-mono text-xs border-0",
                isDanger ? "bg-red-500/20 text-red-400" :
                  isWarning ? "bg-amber-500/20 text-amber-400" :
                    "bg-slate-800/50 text-slate-400"
              )}>
                {percentage}% Used
              </Badge>
            )}
            {isUnlimited && (
              <Badge variant="outline" className="font-mono text-xs border-0 bg-slate-800/50 text-slate-400 flex items-center gap-1">
                <Infinity className="w-3 h-3" /> Unlimited
              </Badge>
            )}
          </div>

          <div className="space-y-1 mb-4">
            <h3 className="text-slate-400 text-sm font-medium">{title}</h3>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-white tracking-tight">{formatNumber(used)}</span>
              <span className="text-sm text-slate-500 font-medium">
                / {isUnlimited ? '∞' : formatNumber(limit)}
              </span>
            </div>
          </div>

          {!isUnlimited ? (
            <div className="relative h-2 w-full bg-slate-800 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${percentage}%` }}
                transition={{ duration: 1, delay: delay + 0.2, ease: "easeOut" }}
                className={cn(
                  "h-full rounded-full transition-colors duration-300",
                  isDanger ? 'bg-red-500' : isWarning ? 'bg-amber-500' : colorStyles.bar
                )}
              />
            </div>
          ) : (
            <div className="h-2 w-full bg-slate-800/50 rounded-full overflow-hidden relative">
              <div className={cn("absolute inset-0 opacity-30 animate-pulse", colorStyles.bg)} />
            </div>
          )}

          {subtitle && <p className="text-xs text-slate-500 mt-3">{subtitle}</p>}
        </CardContent>
      </Card>
    </motion.div>
  );
}

// ============================================
// MAIN COMPONENT
// ============================================
function UsageDashboardSkeleton() {
  return (
    <div className="container max-w-7xl mx-auto p-4 md:p-8 space-y-8 animate-pulse">
      <div className="space-y-4">
        <Skeleton className="h-8 w-48 bg-slate-800" />
        <Skeleton className="h-4 w-96 bg-slate-800" />
      </div>
      <Skeleton className="h-[240px] w-full rounded-2xl bg-slate-800" />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Skeleton className="h-[180px] rounded-xl bg-slate-800" />
        <Skeleton className="h-[180px] rounded-xl bg-slate-800" />
        <Skeleton className="h-[180px] rounded-xl bg-slate-800" />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Skeleton className="h-[300px] rounded-xl bg-slate-800" />
        <Skeleton className="h-[300px] rounded-xl bg-slate-800" />
      </div>
    </div>
  );
}

export default function UsageDashboard() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<UsageDashboardData | null>(null);
  const [plans, setPlans] = useState<PlanConfiguration[]>([]);
  const [billingInterval, setBillingInterval] = useState<'monthly' | 'yearly'>('monthly');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [dashboardRes, plansRes] = await Promise.all([
        usageService.getDashboard(),
        usageService.getAvailablePlans(),
      ]);

      if (dashboardRes.success) {
        setData(dashboardRes.data);
      }
      if (plansRes.success) {
        setPlans(plansRes.data);
      }
    } catch (error: any) {
      console.error('Failed to fetch usage data:', error);
      toast.error('Failed to load usage data');
    } finally {
      setLoading(false);
    }
  };

  // Chart data
  const tokenTrendData = useMemo(() => {
    if (!data?.dailyTokenUsage?.length) return null;

    return {
      labels: data.dailyTokenUsage.map(d =>
        new Date(d.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
      ),
      datasets: [{
        label: 'Tokens Used',
        data: data.dailyTokenUsage.map(d => d.tokens || 0),
        borderColor: '#8b5cf6',
        backgroundColor: (context: any) => {
          const ctx = context.chart.ctx;
          const gradient = ctx.createLinearGradient(0, 0, 0, 300);
          gradient.addColorStop(0, 'rgba(139, 92, 246, 0.4)');
          gradient.addColorStop(1, 'rgba(139, 92, 246, 0.0)');
          return gradient;
        },
        fill: true,
        tension: 0.4,
        pointBackgroundColor: '#8b5cf6',
        pointBorderColor: '#1e293b',
        pointBorderWidth: 2,
        pointHoverBackgroundColor: '#fff',
        pointHoverBorderColor: '#8b5cf6',
      }],
    };
  }, [data?.dailyTokenUsage]);

  const queryTrendData = useMemo(() => {
    if (!data?.dailyQueries?.length) return null;

    return {
      labels: data.dailyQueries.map(d =>
        new Date(d.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
      ),
      datasets: [
        {
          label: 'AI Queries',
          data: data.dailyQueries.map(d => d.ai_count || 0),
          backgroundColor: '#8b5cf6',
          borderRadius: 4,
          stack: 'Stack 0',
        },
        {
          label: 'Manual Queries',
          data: data.dailyQueries.map(d => (d.count || 0) - (d.ai_count || 0)),
          backgroundColor: '#06b6d4',
          borderRadius: 4,
          stack: 'Stack 0',
        },
      ],
    };
  }, [data?.dailyQueries]);

  const operationBreakdownData = useMemo(() => {
    if (!data?.tokenBreakdown?.length) return null;

    const labels: Record<string, string> = {
      'generate_sql': 'SQL Generation',
      'explain_query': 'Query Explanation',
      'chat': 'AI Chat',
      'schema_analysis': 'Schema Analysis',
      'extract_metadata': 'Metadata Extraction',
    };

    return {
      labels: data.tokenBreakdown.map(b => labels[b.operation_type] || b.operation_type),
      datasets: [{
        data: data.tokenBreakdown.map(b => Number(b.total_tokens)),
        backgroundColor: ['#8b5cf6', '#06b6d4', '#10b981', '#f59e0b', '#ef4444'],
        borderColor: '#1e293b',
        borderWidth: 2,
        hoverOffset: 4,
      }],
    };
  }, [data?.tokenBreakdown]);

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        backgroundColor: '#1e293b',
        titleColor: '#f8fafc',
        bodyColor: '#cbd5e1',
        borderColor: 'rgba(255,255,255,0.1)',
        borderWidth: 1,
        padding: 10,
        displayColors: true,
        usePointStyle: true,
      }
    },
    scales: {
      y: {
        grid: { color: 'rgba(255, 255, 255, 0.05)', drawBorder: false },
        ticks: { color: '#64748b', font: { size: 11 } },
        border: { display: false },
      },
      x: {
        grid: { display: false, drawBorder: false },
        ticks: { color: '#64748b', font: { size: 11 } },
        border: { display: false },
      },
    },
    interaction: {
      mode: 'index' as const,
      intersect: false,
    },
  };

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: '#1e293b',
        titleColor: '#f8fafc',
        bodyColor: '#cbd5e1',
        borderColor: 'rgba(255,255,255,0.1)',
        borderWidth: 1,
        padding: 10,
      }
    },
    cutout: '75%',
  };

  if (loading) {
    return <UsageDashboardSkeleton />;
  }

  if (!data) {
    return (
      <div className="p-4 md:p-8 h-full flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-slate-500 mx-auto mb-3" />
          <h3 className="text-lg font-medium text-white mb-1">Failed to load data</h3>
          <p className="text-slate-400 mb-4">We couldn't retrieve your usage statistics.</p>
          <Button onClick={fetchData} variant="outline" className="border-slate-700 hover:bg-slate-800">
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  const currentPlan = plans.find(p => p.plan_type === data.plan.type);

  return (
    <div className="overflow-y-auto h-full scrollbar-thin scrollbar-thumb-slate-800 scrollbar-track-transparent">
      <div className="container max-w-7xl mx-auto p-4 md:p-8 space-y-8 pb-32">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h1 className="text-3xl font-bold text-white tracking-tight mb-2">Usage & Billing</h1>
            <p className="text-slate-400">Track your consumption, manage billing, and upgrade your plan.</p>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            className="flex items-center gap-3"
          >
            <Button
              variant="outline"
              size="sm"
              onClick={fetchData}
              disabled={loading}
              className="border-slate-700 bg-slate-900/50 hover:bg-slate-800 text-slate-300 backdrop-blur-sm"
            >
              <RefreshCw className={cn('w-4 h-4 mr-2', loading && 'animate-spin')} />
              Refresh Data
            </Button>
          </motion.div>
        </div>

        {/* Current Plan Hero Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <Card className="border-0 bg-gradient-to-r from-violet-900/40 via-slate-900/60 to-slate-900/60 backdrop-blur-xl overflow-hidden relative shadow-2xl shadow-black/20">
            <div className="absolute top-0 right-0 p-32 bg-violet-500/10 rounded-full blur-3xl transform translate-x-1/3 -translate-y-1/3 pointer-events-none" />
            <CardContent className="p-8 relative z-10">
              <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-8">
                <div className="flex items-start gap-6">
                  <div className="p-4 rounded-2xl bg-gradient-to-br from-violet-500 to-indigo-600 shadow-lg shadow-violet-500/20">
                    <Crown className="w-8 h-8 text-white" />
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-3">
                      <h2 className="text-2xl font-bold text-white">{data.plan.displayName} Plan</h2>
                      <PlanBadge planType={data.plan.type} />
                    </div>
                    <p className="text-slate-300 max-w-lg leading-relaxed">
                      {currentPlan?.description || 'Your currently active subscription plan.'}
                    </p>
                    <div className="flex flex-wrap items-center gap-6 mt-4 pt-2">
                      <div className="flex items-center gap-2 text-sm text-slate-400">
                        <Clock className="w-4 h-4 text-violet-400" />
                        <span>Renews {new Date(data.plan.billingCycleEnd).toLocaleDateString(undefined, { dateStyle: 'long' })}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-slate-400">
                        <Calendar className="w-4 h-4 text-cyan-400" />
                        <span>{data.plan.daysRemaining} days remaining in cycle</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
                  {(data.plan.type !== 'enterprise' && data.plan.type !== 'lifetime') && (
                    <Button
                      size="lg"
                      className="bg-white text-slate-900 hover:bg-slate-100 font-semibold shadow-lg shadow-white/5"
                      onClick={() => navigate('/dashboard/pricing')}
                    >
                      <ArrowUpRight className="w-4 h-4 mr-2" />
                      Upgrade Plan
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    size="lg"
                    className="border-white/10 text-slate-300 hover:bg-white/5 hover:text-white"
                    onClick={() => navigate('/settings')} // Or a billing settings page
                  >
                    Manage Billing
                  </Button>
                </div>
              </div>

              {/* Features Line */}
              {currentPlan?.features && (
                <div className="mt-8 pt-6 border-t border-white/5 flex flex-col sm:flex-row items-start sm:items-center gap-4">
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 shrink-0">Includes:</p>
                  <div className="flex flex-wrap gap-x-6 gap-y-2">
                    {currentPlan.features.slice(0, 4).map((feature: any, idx: number) => (
                      <div key={idx} className="flex items-center gap-2 text-sm text-slate-300">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                        <span>{feature}</span>
                      </div>
                    ))}
                    {currentPlan.features.length > 4 && (
                      <span className="text-xs text-slate-500 py-1 px-2 rounded-full bg-slate-800/50">+{currentPlan.features.length - 4} more</span>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <UsageLimitCard
            title="AI Tokens Used"
            icon={Zap}
            used={data.tokens.used}
            limit={data.tokens.limit}
            isUnlimited={data.tokens.isUnlimited}
            color="violet"
            subtitle={`${data.tokens.isUnlimited ? 0 : Math.round(((data.tokens.limit - data.tokens.used) / data.tokens.limit) * 100)}% remaining`}
            delay={0.1}
          />
          <UsageLimitCard
            title="Queries Executed"
            icon={MessageSquare}
            used={data.queries.used}
            limit={data.queries.limit}
            isUnlimited={data.queries.isUnlimited}
            color="cyan"
            subtitle={`${data.queries.stats?.ai_queries || 0} AI-generated`}
            delay={0.2}
          />
          <UsageLimitCard
            title="Active Connections"
            icon={Database}
            used={data.connections.used}
            limit={data.connections.limit}
            isUnlimited={data.connections.isUnlimited}
            color="blue"
            subtitle="Database sources connected"
            delay={0.3}
          />
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Card className="bg-slate-900/50 border-slate-800 backdrop-blur-sm h-full">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <div>
                  <CardTitle className="text-lg text-white group flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-violet-400" />
                    Token Usage Trend
                  </CardTitle>
                  <CardDescription className="text-slate-400 text-xs">Last 30 days activity</CardDescription>
                </div>
              </CardHeader>
              <CardContent>
                <div className="h-[280px] w-full mt-4">
                  {tokenTrendData ? (
                    <Line options={chartOptions} data={tokenTrendData} />
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full text-slate-500">
                      <BarChart3 className="w-10 h-10 mb-2 opacity-20" />
                      <p className="text-sm">No usage data recorded yet</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <Card className="bg-slate-900/50 border-slate-800 backdrop-blur-sm h-full">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <div>
                  <CardTitle className="text-lg text-white flex items-center gap-2">
                    <Activity className="w-5 h-5 text-cyan-400" />
                    Query Volume
                  </CardTitle>
                  <CardDescription className="text-slate-400 text-xs">AI vs Manual execution</CardDescription>
                </div>
              </CardHeader>
              <CardContent>
                <div className="h-[280px] w-full mt-4">
                  {queryTrendData ? (
                    <Bar options={chartOptions} data={queryTrendData} />
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full text-slate-500">
                      <BarChart3 className="w-10 h-10 mb-2 opacity-20" />
                      <p className="text-sm">No usage data recorded yet</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Breakdown & Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <motion.div className="lg:col-span-1" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}>
            <Card className="bg-slate-900/50 border-slate-800 backdrop-blur-sm h-full flex flex-col">
              <CardHeader>
                <CardTitle className="text-base text-white flex items-center gap-2">
                  <PieChart className="w-4 h-4 text-emerald-400" />
                  Usage Breakdown
                </CardTitle>
              </CardHeader>
              <CardContent className="flex-1 min-h-[300px] flex flex-col justify-center">
                <div className="relative h-[200px] flex items-center justify-center mb-6">
                  {operationBreakdownData ? (
                    <>
                      <Doughnut options={doughnutOptions} data={operationBreakdownData} />
                      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                        <span className="text-3xl font-bold text-white tracking-tight">{formatNumber(data.tokens.used)}</span>
                        <span className="text-xs text-slate-500 uppercase tracking-widest font-medium">Tokens</span>
                      </div>
                    </>
                  ) : (
                    <div className="text-center text-slate-500 bg-slate-800/20 rounded-full h-32 w-32 flex items-center justify-center">
                      No Data
                    </div>
                  )}
                </div>
                {data.tokenBreakdown?.length > 0 && (
                  <div className="space-y-3">
                    {data.tokenBreakdown.map((item, idx) => {
                      const colors = ['bg-violet-500', 'bg-cyan-500', 'bg-emerald-500', 'bg-amber-500', 'bg-rose-500'];
                      const labels: Record<string, string> = {
                        'generate_sql': 'SQL Generation',
                        'explain_query': 'Query Explanation',
                        'chat': 'AI Chat',
                        'schema_analysis': 'Schema Analysis',
                        'extract_metadata': 'Metadata',
                      };
                      return (
                        <div key={idx} className="flex items-center justify-between text-xs px-2">
                          <div className="flex items-center gap-2 text-slate-300">
                            <span className={cn('w-2 h-2 rounded-full', colors[idx % colors.length])} />
                            {labels[item.operation_type] || item.operation_type}
                          </div>
                          <span className="text-slate-400 font-mono">{formatNumber(Number(item.total_tokens))}</span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>

          <motion.div className="lg:col-span-2" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7 }}>
            <Card className="bg-slate-900/50 border-slate-800 backdrop-blur-sm h-full flex flex-col">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-lg text-white">Recent AI Operations</CardTitle>
                  <CardDescription className="text-slate-400 text-xs">Real-time log of token consumption</CardDescription>
                </div>
              </CardHeader>
              <CardContent className="flex-1 overflow-hidden p-0">
                <div className="overflow-y-auto max-h-[350px] scrollbar-thin scrollbar-thumb-slate-800 p-6 pt-0 space-y-1">
                  {data.recentOperations?.length > 0 ? (
                    data.recentOperations.map((op, i) => {
                      const labels: Record<string, { label: string; icon: React.ElementType; color: string; bg: string }> = {
                        'generate_sql': { label: 'SQL Gen', icon: Code2, color: 'text-violet-400', bg: 'bg-violet-500/10' },
                        'explain_query': { label: 'Explain', icon: MessageSquare, color: 'text-cyan-400', bg: 'bg-cyan-500/10' },
                        'chat': { label: 'Chat', icon: Brain, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
                        'schema_analysis': { label: 'Schema', icon: Database, color: 'text-amber-400', bg: 'bg-amber-500/10' },
                        'extract_metadata': { label: 'Metadata', icon: Activity, color: 'text-blue-400', bg: 'bg-blue-500/10' },
                      };
                      const config = labels[op.operation_type] || { label: op.operation_type, icon: Zap, color: 'text-slate-400', bg: 'bg-slate-500/10' };
                      const OpIcon = config.icon;

                      return (
                        <div key={op.id || i} className="group flex items-center gap-4 p-3 rounded-xl hover:bg-slate-800/50 transition-colors border border-transparent hover:border-slate-800">
                          <div className={cn("p-2 rounded-lg shrink-0", config.bg)}>
                            <OpIcon className={cn("w-4 h-4", config.color)} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-0.5">
                              <p className="text-sm font-medium text-slate-200">{config.label}</p>
                              <Badge variant="secondary" className="text-[10px] h-5 px-1.5 bg-slate-800 text-slate-500 group-hover:bg-slate-700">{op.model}</Badge>
                            </div>
                            <p className="text-xs text-slate-500 truncate">{op.prompt_preview || 'No preview available'}</p>
                          </div>
                          <div className="text-right shrink-0">
                            <p className="text-sm font-bold text-white font-mono">{formatNumber(op.total_tokens)}</p>
                            <p className="text-[10px] text-slate-500">{new Date(op.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="flex flex-col items-center justify-center py-12 text-slate-500">
                      <Brain className="w-12 h-12 mb-3 opacity-20" />
                      <p>No recent activity found</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Available Plans (If upgrade available) */}
        {plans.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="pt-8 border-t border-slate-800"
          >
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
              <div className="flex items-center gap-2">
                <CircleDollarSign className="w-5 h-5 text-emerald-400" />
                <h2 className="text-xl font-bold text-white">Subscription Plans</h2>
              </div>

              <div className="flex items-center p-1 bg-slate-900 rounded-lg border border-slate-800 self-start md:self-auto">
                <button
                  onClick={() => setBillingInterval('monthly')}
                  className={cn(
                    "px-4 py-1.5 text-sm font-medium rounded-md transition-all duration-200",
                    billingInterval === 'monthly'
                      ? "bg-slate-800 text-white shadow-sm"
                      : "text-slate-400 hover:text-slate-200"
                  )}
                >
                  Monthly
                </button>
                <button
                  onClick={() => setBillingInterval('yearly')}
                  className={cn(
                    "px-4 py-1.5 text-sm font-medium rounded-md transition-all duration-200",
                    billingInterval === 'yearly'
                      ? "bg-slate-800 text-white shadow-sm"
                      : "text-slate-400 hover:text-slate-200"
                  )}
                >
                  Yearly <span className="ml-1 text-emerald-400 text-xs">-20%</span>
                </button>
              </div>
            </div>

            <div className="flex flex-wrap justify-center gap-6">
              {plans.filter(p => {
                // Filter out base 'pro' if 'pro_monthly' exists to avoid duplicates
                if (p.plan_type === 'pro' && plans.some(op => op.plan_type === 'pro_monthly')) return false;
                if (['free', 'enterprise'].includes(p.plan_type)) return false;
                if (p.plan_type === 'lifetime') return true;

                const isYearly = p.plan_type.includes('yearly');
                const isMonthly = p.plan_type.includes('monthly') || p.plan_type === 'pro';

                return billingInterval === 'monthly' ? isMonthly : isYearly;
              }).map((plan) => {
                const isCurrentPlan = plan.plan_type === data.plan.type;

                return (
                  <Card key={plan.plan_type} className={cn(
                    "w-full md:max-w-[350px] group bg-slate-900/30 border-slate-800 transition-all duration-300 flex flex-col relative overflow-hidden",
                    isCurrentPlan
                      ? 'border-emerald-500/50 bg-emerald-900/10 ring-1 ring-emerald-500/20'
                      : 'hover:border-slate-700 hover:bg-slate-900/50 hover:-translate-y-1',
                    plan.plan_type.includes('pro') && !isCurrentPlan ? 'border-violet-500/20' : ''
                  )}>
                    {isCurrentPlan && (
                      <div className="absolute top-0 right-0 p-3">
                        <Badge className="bg-emerald-500 text-white hover:bg-emerald-600 border-none">
                          Current Plan
                        </Badge>
                      </div>
                    )}

                    <CardContent className="p-6 flex flex-col h-full bg-slate-100/5">
                      <div className="mb-4 pr-8">
                        <h3 className="text-lg font-bold text-white mb-1">{plan.display_name}</h3>
                        <p className="text-sm text-slate-500 line-clamp-2 h-10">{plan.description}</p>
                      </div>
                      <div className="mb-6">
                        <div className="flex items-baseline gap-1">
                          <span className="text-3xl font-bold text-white">${plan.plan_type === 'lifetime' ? plan.price_yearly : plan.price_monthly}</span>
                          <span className="text-slate-500">{plan.plan_type === 'lifetime' ? '/one-time' : '/mo'}</span>
                        </div>
                      </div>
                      <div className="space-y-3 mb-8 flex-1">
                        <div className="flex items-center gap-2 text-sm text-slate-400">
                          <Zap className="w-4 h-4 text-violet-400 shrink-0" />
                          {plan.ai_tokens_limit === -1 ? 'Unlimited' : formatNumber(plan.ai_tokens_limit)} Tokens
                        </div>
                        <div className="flex items-center gap-2 text-sm text-slate-400">
                          <MessageSquare className="w-4 h-4 text-cyan-400 shrink-0" />
                          {plan.queries_limit === -1 ? 'Unlimited' : formatNumber(plan.queries_limit)} Queries
                        </div>
                        <div className="flex items-center gap-2 text-sm text-slate-400">
                          <Database className="w-4 h-4 text-blue-400 shrink-0" />
                          {plan.connections_limit === -1 ? 'Unlimited' : plan.connections_limit} Connections
                        </div>
                      </div>
                      <Button
                        variant={isCurrentPlan ? "outline" : "secondary"}
                        disabled={isCurrentPlan}
                        onClick={() => navigate('/dashboard/pricing')}
                        className={cn(
                          "w-full mb-0",
                          !isCurrentPlan && plan.plan_type.includes('pro') ? "bg-violet-600 hover:bg-violet-700 text-white" : "",
                          isCurrentPlan ? "border-emerald-500/30 text-emerald-400 bg-emerald-500/10 opacity-100" : ""
                        )}
                      >
                        {isCurrentPlan ? 'Active Subscribed' : 'Upgrade Plan'}
                      </Button>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
