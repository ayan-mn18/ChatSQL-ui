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
  CheckCircle,
  Infinity,
  Calendar,
  Activity,
  Brain,
  Code2,
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
    free: { label: 'Free', className: 'bg-gray-500/20 text-gray-400 border-gray-500/30' },
    pro: { label: 'Pro', className: 'bg-blue-500/20 text-blue-400 border-blue-500/30' },
    enterprise: { label: 'Enterprise', className: 'bg-purple-500/20 text-purple-400 border-purple-500/30' },
  }[planType] || { label: planType, className: 'bg-gray-500/20 text-gray-400 border-gray-500/30' };

  return (
    <Badge variant="outline" className={cn('text-xs font-medium', config.className)}>
      {planType === 'pro' && <Crown className="w-3 h-3 mr-1" />}
      {planType === 'enterprise' && <Sparkles className="w-3 h-3 mr-1" />}
      {config.label}
    </Badge>
  );
}

// ============================================
// COMPONENT: Usage Progress Card
// ============================================
function UsageProgressCard({
  title,
  icon: Icon,
  used,
  limit,
  isUnlimited,
  color,
  subtitle,
}: {
  title: string;
  icon: React.ElementType;
  used: number;
  limit: number;
  isUnlimited: boolean;
  color: string;
  subtitle?: string;
}) {
  const percentage = isUnlimited ? 0 : Math.min(100, Math.round((used / limit) * 100));
  const isWarning = percentage >= 80 && percentage < 100;
  const isDanger = percentage >= 100;

  return (
    <Card className="bg-[#273142] border-white/5">
      <CardContent className="p-5">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className={cn('p-2.5 rounded-xl', `bg-${color}-500/20`)}>
              <Icon className={cn('w-5 h-5', `text-${color}-400`)} />
            </div>
            <div>
              <p className="text-sm font-medium text-white">{title}</p>
              {subtitle && <p className="text-xs text-gray-500">{subtitle}</p>}
            </div>
          </div>
          {!isUnlimited && (
            <span className={cn(
              'text-xs font-medium px-2 py-0.5 rounded-full',
              isDanger ? 'bg-red-500/20 text-red-400' :
                isWarning ? 'bg-yellow-500/20 text-yellow-400' :
                  'bg-white/5 text-gray-400'
            )}>
              {percentage}%
            </span>
          )}
        </div>

        <div className="space-y-2">
          <div className="flex items-end justify-between">
            <span className="text-2xl font-bold text-white">{formatNumber(used)}</span>
            <span className="text-sm text-gray-400">
              / {isUnlimited ? <Infinity className="w-4 h-4 inline" /> : formatNumber(limit)}
            </span>
          </div>

          {!isUnlimited && (
            <Progress
              value={percentage}
              className={cn(
                'h-2',
                isDanger ? '[&>div]:bg-red-500' :
                  isWarning ? '[&>div]:bg-yellow-500' :
                    `[&>div]:bg-${color}-500`
              )}
            />
          )}

          {isUnlimited && (
            <div className="flex items-center gap-1.5 text-xs text-purple-400">
              <Infinity className="w-3.5 h-3.5" />
              Unlimited
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// ============================================
// MAIN COMPONENT
// ============================================
function UsageDashboardSkeleton() {
  return (
    <div className="p-4 md:p-8 space-y-6 md:space-y-8 pb-24 md:pb-8 overflow-y-auto h-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <Skeleton className="h-8 w-56 mb-2" />
          <Skeleton className="h-4 w-80" />
        </div>
        <div className="flex items-center gap-3">
          <Skeleton className="h-9 w-24 rounded-md" />
        </div>
      </div>

      {/* Current Plan Card */}
      <Card className="bg-gradient-to-br from-[#273142] to-[#1B2431] border-white/10 overflow-hidden">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-start gap-4">
              <Skeleton className="h-14 w-14 rounded-2xl" />
              <div className="space-y-2">
                <Skeleton className="h-6 w-56" />
                <Skeleton className="h-4 w-72" />
                <div className="flex items-center gap-4">
                  <Skeleton className="h-4 w-40" />
                  <Skeleton className="h-4 w-40" />
                </div>
              </div>
            </div>
            <Skeleton className="h-10 w-36 rounded-md" />
          </div>

          <div className="mt-6 pt-6 border-t border-white/10">
            <Skeleton className="h-3 w-28 mb-3" />
            <div className="flex flex-wrap gap-2">
              <Skeleton className="h-6 w-28 rounded-full" />
              <Skeleton className="h-6 w-36 rounded-full" />
              <Skeleton className="h-6 w-32 rounded-full" />
              <Skeleton className="h-6 w-40 rounded-full" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Usage Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
        {[0, 1, 2].map((i) => (
          <Card key={i} className="bg-[#273142] border-white/5">
            <CardContent className="p-5">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <Skeleton className="h-10 w-10 rounded-xl" />
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-28" />
                    <Skeleton className="h-3 w-36" />
                  </div>
                </div>
                <Skeleton className="h-5 w-10 rounded-full" />
              </div>
              <div className="space-y-3">
                <div className="flex items-end justify-between">
                  <Skeleton className="h-8 w-20" />
                  <Skeleton className="h-4 w-16" />
                </div>
                <Skeleton className="h-2 w-full rounded" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
        {[0, 1].map((i) => (
          <Card key={i} className="bg-[#273142] border-white/5">
            <CardHeader>
              <Skeleton className="h-5 w-48" />
              <Skeleton className="h-4 w-64" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-[250px] w-full" />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
        <Card className="bg-[#273142] border-white/5">
          <CardHeader>
            <Skeleton className="h-5 w-36" />
            <Skeleton className="h-4 w-40" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-[200px] w-full" />
            <div className="mt-4 space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-11/12" />
              <Skeleton className="h-4 w-10/12" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-[#273142] border-white/5 lg:col-span-2">
          <CardHeader>
            <Skeleton className="h-5 w-44" />
            <Skeleton className="h-4 w-64" />
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function UsageDashboard() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<UsageDashboardData | null>(null);
  const [plans, setPlans] = useState<PlanConfiguration[]>([]);

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
        backgroundColor: 'rgba(139, 92, 246, 0.1)',
        fill: true,
        tension: 0.4,
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
          borderColor: '#8b5cf6',
          backgroundColor: 'rgba(139, 92, 246, 0.5)',
        },
        {
          label: 'Manual Queries',
          data: data.dailyQueries.map(d => (d.count || 0) - (d.ai_count || 0)),
          borderColor: '#06b6d4',
          backgroundColor: 'rgba(6, 182, 212, 0.5)',
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
        borderWidth: 0,
        cutout: '70%',
      }],
    };
  }, [data?.tokenBreakdown]);

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        position: 'bottom' as const,
        labels: { color: '#94a3b8', padding: 15, font: { size: 12 } }
      },
    },
    scales: {
      y: {
        grid: { color: 'rgba(255, 255, 255, 0.05)' },
        ticks: { color: '#94a3b8' },
        border: { display: false },
      },
      x: {
        grid: { display: false },
        ticks: { color: '#94a3b8' },
        border: { display: false },
      },
    },
  };

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
  };

  if (loading) {
    return <UsageDashboardSkeleton />;
  }

  if (!data) {
    return (
      <div className="p-4 md:p-8 h-full flex items-center justify-center">
        <p className="text-gray-400">Failed to load usage data</p>
      </div>
    );
  }

  const currentPlan = plans.find(p => p.plan_type === data.plan.type);

  return (
    <div className="p-4 md:p-8 space-y-6 md:space-y-8 pb-24 md:pb-8 overflow-y-auto h-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-white mb-2">Usage & Billing</h1>
          <p className="text-slate-400 text-sm">Monitor your AI tokens, queries, and subscription plan</p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchData}
            disabled={loading}
            className="border-white/10 bg-transparent text-gray-300 hover:bg-white/5"
          >
            <RefreshCw className={cn('w-4 h-4 mr-2', loading && 'animate-spin')} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Current Plan Card */}
      <Card className="bg-gradient-to-br from-[#273142] to-[#1B2431] border-white/10 overflow-hidden">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-2xl bg-purple-500/20">
                <Crown className="w-8 h-8 text-purple-400" />
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h2 className="text-xl font-bold text-white">{data.plan.displayName} Plan</h2>
                  <PlanBadge planType={data.plan.type} />
                </div>
                <p className="text-sm text-gray-400 mb-3">
                  {currentPlan?.description || 'Your current subscription plan'}
                </p>
                <div className="flex items-center gap-4 text-sm">
                  <span className="flex items-center gap-1.5 text-gray-400">
                    <Calendar className="w-4 h-4" />
                    {data.plan.daysRemaining} days remaining
                  </span>
                  <span className="flex items-center gap-1.5 text-gray-400">
                    <Clock className="w-4 h-4" />
                    Renews {new Date(data.plan.billingCycleEnd).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>

            {data.plan.type !== 'enterprise' && (
              <Button
                className="bg-purple-600 hover:bg-purple-700 text-white shrink-0"
                onClick={() => navigate('/dashboard/pricing')}
              >
                <ArrowUpRight className="w-4 h-4 mr-2" />
                Upgrade Plan
              </Button>
            )}
          </div>

          {/* Plan Features */}
          {currentPlan?.features && (
            <div className="mt-6 pt-6 border-t border-white/10">
              <p className="text-xs text-gray-500 uppercase tracking-wider mb-3">Plan Features</p>
              <div className="flex flex-wrap gap-2">
                {currentPlan.features.map((feature, idx) => (
                  <Badge key={idx} variant="outline" className="border-white/10 text-gray-300 text-xs">
                    <CheckCircle className="w-3 h-3 mr-1 text-green-400" />
                    {feature}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Usage Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
        <UsageProgressCard
          title="AI Tokens"
          icon={Zap}
          used={data.tokens.used}
          limit={data.tokens.limit}
          isUnlimited={data.tokens.isUnlimited}
          color="purple"
          subtitle="This billing cycle"
        />
        <UsageProgressCard
          title="Queries Executed"
          icon={MessageSquare}
          used={data.queries.used}
          limit={data.queries.limit}
          isUnlimited={data.queries.isUnlimited}
          color="cyan"
          subtitle={`${data.queries.stats?.ai_queries || 0} AI-generated`}
        />
        <UsageProgressCard
          title="Database Connections"
          icon={Database}
          used={data.connections.used}
          limit={data.connections.limit}
          isUnlimited={data.connections.isUnlimited}
          color="blue"
          subtitle="Active connections"
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
        {/* Token Usage Trend */}
        <Card className="bg-[#273142] border-white/5">
          <CardHeader>
            <CardTitle className="text-white text-lg font-medium flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-purple-400" />
              Token Usage (30 Days)
            </CardTitle>
            <CardDescription className="text-slate-400">
              Daily AI token consumption
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[250px]">
              {tokenTrendData ? (
                <Line options={chartOptions} data={tokenTrendData} />
              ) : (
                <div className="flex items-center justify-center h-full text-gray-500">
                  <div className="text-center">
                    <Brain className="w-10 h-10 mx-auto mb-2 opacity-50" />
                    <p>No token usage data yet</p>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Query Trends */}
        <Card className="bg-[#273142] border-white/5">
          <CardHeader>
            <CardTitle className="text-white text-lg font-medium flex items-center gap-2">
              <Activity className="w-5 h-5 text-cyan-400" />
              Query Activity (30 Days)
            </CardTitle>
            <CardDescription className="text-slate-400">
              AI vs Manual queries over time
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[250px]">
              {queryTrendData ? (
                <Bar options={chartOptions} data={queryTrendData} />
              ) : (
                <div className="flex items-center justify-center h-full text-gray-500">
                  <div className="text-center">
                    <Code2 className="w-10 h-10 mx-auto mb-2 opacity-50" />
                    <p>No query data yet</p>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
        {/* Token Breakdown */}
        <Card className="bg-[#273142] border-white/5">
          <CardHeader>
            <CardTitle className="text-white text-lg font-medium">Token Breakdown</CardTitle>
            <CardDescription className="text-slate-400">By operation type</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[200px] relative flex items-center justify-center">
              {operationBreakdownData ? (
                <>
                  <Doughnut options={doughnutOptions} data={operationBreakdownData} />
                  <div className="absolute inset-0 flex items-center justify-center flex-col pointer-events-none">
                    <span className="text-2xl font-bold text-white">{formatNumber(data.tokens.used)}</span>
                    <span className="text-xs text-slate-400">Total</span>
                  </div>
                </>
              ) : (
                <div className="text-center text-gray-500">
                  <Zap className="w-10 h-10 mx-auto mb-2 opacity-50" />
                  <p>No data yet</p>
                </div>
              )}
            </div>
            {data.tokenBreakdown?.length > 0 && (
              <div className="mt-4 space-y-2">
                {data.tokenBreakdown.map((item, idx) => {
                  const colors = ['bg-purple-500', 'bg-cyan-500', 'bg-green-500', 'bg-yellow-500', 'bg-red-500'];
                  const labels: Record<string, string> = {
                    'generate_sql': 'SQL Generation',
                    'explain_query': 'Query Explanation',
                    'chat': 'AI Chat',
                    'schema_analysis': 'Schema Analysis',
                    'extract_metadata': 'Metadata',
                  };
                  return (
                    <div key={idx} className="flex items-center justify-between text-sm">
                      <span className="flex items-center gap-2 text-gray-400">
                        <span className={cn('w-2 h-2 rounded-full', colors[idx % colors.length])} />
                        {labels[item.operation_type] || item.operation_type}
                      </span>
                      <span className="text-white font-medium">{formatNumber(Number(item.total_tokens))}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent AI Operations */}
        <Card className="bg-[#273142] border-white/5 lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-white text-lg font-medium">Recent AI Operations</CardTitle>
            <CardDescription className="text-slate-400">Latest token-consuming operations</CardDescription>
          </CardHeader>
          <CardContent>
            {data.recentOperations?.length > 0 ? (
              <div className="space-y-2 max-h-[300px] overflow-y-auto scrollbar-thin">
                {data.recentOperations.map((op) => {
                  const labels: Record<string, { label: string; icon: React.ElementType; color: string }> = {
                    'generate_sql': { label: 'SQL Gen', icon: Code2, color: 'text-purple-400' },
                    'explain_query': { label: 'Explain', icon: MessageSquare, color: 'text-cyan-400' },
                    'chat': { label: 'Chat', icon: Brain, color: 'text-green-400' },
                    'schema_analysis': { label: 'Schema', icon: Database, color: 'text-yellow-400' },
                    'extract_metadata': { label: 'Metadata', icon: Activity, color: 'text-blue-400' },
                  };
                  const config = labels[op.operation_type] || { label: op.operation_type, icon: Zap, color: 'text-gray-400' };
                  const OpIcon = config.icon;

                  return (
                    <div key={op.id} className="flex items-center justify-between p-3 bg-white/5 rounded-lg hover:bg-white/10 transition-colors">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className={cn('p-1.5 rounded-lg bg-white/5', config.color)}>
                          <OpIcon className="w-4 h-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-white">{config.label}</span>
                            <Badge variant="outline" className="text-[10px] border-white/10 text-gray-500">
                              {op.model}
                            </Badge>
                          </div>
                          <p className="text-xs text-gray-500 truncate mt-0.5">
                            {op.prompt_preview || 'No preview available'}
                          </p>
                        </div>
                      </div>
                      <div className="text-right shrink-0 ml-4">
                        <p className="text-sm font-medium text-white">{formatNumber(op.total_tokens)} tokens</p>
                        <p className="text-xs text-gray-500">
                          {new Date(op.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Brain className="w-10 h-10 mx-auto mb-2 opacity-50" />
                <p>No AI operations yet</p>
                <p className="text-xs mt-1">Start using AI features to see your usage here</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Available Plans */}
      {plans.length > 0 && data.plan.type !== 'enterprise' && (
        <Card className="bg-[#273142] border-white/5">
          <CardHeader>
            <CardTitle className="text-white text-lg font-medium flex items-center gap-2">
              <CircleDollarSign className="w-5 h-5 text-green-400" />
              Available Plans
            </CardTitle>
            <CardDescription className="text-slate-400">
              Compare plans and upgrade to unlock more features
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {plans.map((plan) => {
                const isCurrentPlan = plan.plan_type === data.plan.type;
                return (
                  <div
                    key={plan.plan_type}
                    className={cn(
                      'p-4 rounded-xl border transition-all',
                      isCurrentPlan
                        ? 'border-purple-500/50 bg-purple-500/10'
                        : 'border-white/10 bg-white/5 hover:border-white/20'
                    )}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-semibold text-white">{plan.display_name}</h3>
                      {isCurrentPlan && (
                        <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/30">
                          Current
                        </Badge>
                      )}
                    </div>
                    <div className="mb-4">
                      <span className="text-2xl font-bold text-white">
                        ${plan.price_monthly}
                      </span>
                      <span className="text-gray-400 text-sm">/month</span>
                    </div>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2 text-gray-400">
                        <Zap className="w-4 h-4 text-purple-400" />
                        {plan.ai_tokens_limit === -1 ? 'Unlimited' : formatNumber(plan.ai_tokens_limit)} tokens
                      </div>
                      <div className="flex items-center gap-2 text-gray-400">
                        <MessageSquare className="w-4 h-4 text-cyan-400" />
                        {plan.queries_limit === -1 ? 'Unlimited' : formatNumber(plan.queries_limit)} queries
                      </div>
                      <div className="flex items-center gap-2 text-gray-400">
                        <Database className="w-4 h-4 text-blue-400" />
                        {plan.connections_limit === -1 ? 'Unlimited' : plan.connections_limit} connections
                      </div>
                    </div>
                    {!isCurrentPlan && (
                      <Button
                        variant={plan.plan_type === 'pro' ? 'default' : 'outline'}
                        size="sm"
                        className={cn(
                          'w-full mt-4',
                          plan.plan_type === 'pro'
                            ? 'bg-purple-600 hover:bg-purple-700'
                            : 'border-white/10'
                        )}
                        onClick={() => {
                          if (plan.plan_type === 'enterprise') {
                            navigate('/contact?plan=enterprise');
                          } else {
                            navigate('/dashboard/pricing');
                          }
                        }}
                      >
                        {plan.plan_type === 'enterprise' ? 'Contact Sales' : 'Upgrade'}
                      </Button>
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Query Stats Summary */}
      <Card className="bg-[#273142] border-white/5">
        <CardHeader>
          <CardTitle className="text-white text-lg font-medium">Query Statistics</CardTitle>
          <CardDescription className="text-slate-400">This billing cycle performance</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="text-center p-4 bg-white/5 rounded-lg">
              <p className="text-2xl font-bold text-white">{data.queries.stats?.total_queries || 0}</p>
              <p className="text-xs text-gray-400 mt-1">Total Queries</p>
            </div>
            <div className="text-center p-4 bg-white/5 rounded-lg">
              <p className="text-2xl font-bold text-purple-400">{data.queries.stats?.ai_queries || 0}</p>
              <p className="text-xs text-gray-400 mt-1">AI Generated</p>
            </div>
            <div className="text-center p-4 bg-white/5 rounded-lg">
              <p className="text-2xl font-bold text-cyan-400">{data.queries.stats?.manual_queries || 0}</p>
              <p className="text-xs text-gray-400 mt-1">Manual SQL</p>
            </div>
            <div className="text-center p-4 bg-white/5 rounded-lg">
              <p className="text-2xl font-bold text-green-400">{data.queries.stats?.successful_queries || 0}</p>
              <p className="text-xs text-gray-400 mt-1">Successful</p>
            </div>
            <div className="text-center p-4 bg-white/5 rounded-lg">
              <p className="text-2xl font-bold text-white">{data.queries.stats?.avg_execution_time || 0}ms</p>
              <p className="text-xs text-gray-400 mt-1">Avg Execution</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
