import { useState, useEffect } from 'react';
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
import {
  ArrowUpRight,
  ArrowDownRight,
  Activity,
  Database,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  Clock,
  Zap,
  RefreshCw,
  Loader2,
} from 'lucide-react';
import { connectionService } from '@/services/connection.service';
import toast from 'react-hot-toast';

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

export default function AnalyticsPage() {
  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState<any>(null);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const response = await connectionService.getWorkspaceAnalytics();
      if (response.success) {
        setAnalytics(response);
      }
    } catch (error: any) {
      console.error('Failed to fetch workspace analytics:', error);
      toast.error('Failed to load analytics');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-4 md:p-8 space-y-6 md:space-y-8 pb-24 md:pb-8 overflow-y-auto h-full">
        <div className="flex items-center justify-center h-[60vh]">
          <Loader2 className="w-8 h-8 text-blue-400 animate-spin" />
        </div>
      </div>
    );
  }

  if (!analytics) return null;

  const { summary, queryTrends, topConnections, recentQueries, slowestQueries, queryTypeDistribution } = analytics;

  // Query Trends Chart
  const queryTrendsData = {
    labels: queryTrends?.map((t: any) => new Date(t.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })) || [],
    datasets: [
      {
        label: 'AI Queries',
        data: queryTrends?.map((t: any) => parseInt(t.ai_count)) || [],
        borderColor: '#8b5cf6',
        backgroundColor: 'rgba(139, 92, 246, 0.1)',
        fill: true,
        tension: 0.4,
      },
      {
        label: 'Manual Queries',
        data: queryTrends?.map((t: any) => parseInt(t.manual_count)) || [],
        borderColor: '#06b6d4',
        backgroundColor: 'rgba(6, 182, 212, 0.1)',
        fill: true,
        tension: 0.4,
      },
    ],
  };

  // AI vs Manual Distribution
  const aiVsManualData = {
    labels: ['AI Generated', 'Manual SQL'],
    datasets: [
      {
        data: [summary?.aiQueries || 0, summary?.manualQueries || 0],
        backgroundColor: ['#8b5cf6', '#06b6d4'],
        borderWidth: 0,
        cutout: '70%',
      },
    ],
  };

  // Query Type Distribution
  const queryTypeData = {
    labels: queryTypeDistribution?.map((t: any) => t.query_type || 'Unknown') || [],
    datasets: [
      {
        label: 'Queries',
        data: queryTypeDistribution?.map((t: any) => parseInt(t.count)) || [],
        backgroundColor: [
          '#8b5cf6',
          '#06b6d4',
          '#10b981',
          '#f59e0b',
          '#ef4444',
          '#ec4899',
        ],
      },
    ],
  };

  const commonOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        position: 'bottom' as const,
        labels: {
          color: '#94a3b8',
          padding: 15,
          font: { size: 12 }
        }
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
    plugins: {
      legend: { display: false },
    },
  };

  const stats = [
    {
      title: 'Total Queries',
      value: summary?.totalQueries?.toLocaleString() || '0',
      change: summary?.activeDays > 0 ? `${summary.activeDays} days active` : 'No activity',
      trend: 'neutral' as const,
      icon: Activity,
      color: 'bg-purple-500'
    },
    {
      title: 'Active Connections',
      value: summary?.activeConnections?.toString() || '0',
      change: `${summary?.successRate || 100}% success rate`,
      trend: summary?.successRate >= 90 ? 'up' as const : 'down' as const,
      icon: Database,
      color: 'bg-blue-500'
    },
    {
      title: 'Avg Query Time',
      value: `${summary?.avgExecutionTime || 0}ms`,
      change: summary?.avgExecutionTime < 1000 ? 'Good performance' : 'Consider optimization',
      trend: summary?.avgExecutionTime < 1000 ? 'up' as const : 'down' as const,
      icon: Zap,
      color: 'bg-yellow-500'
    },
    {
      title: 'Failed Queries',
      value: summary?.failedQueries?.toLocaleString() || '0',
      change: `${summary?.successfulQueries || 0} successful`,
      trend: summary?.failedQueries > 0 ? 'down' as const : 'up' as const,
      icon: AlertCircle,
      color: 'bg-red-500'
    },
  ];

  return (
    <div className="p-4 md:p-8 space-y-6 md:space-y-8 pb-24 md:pb-8 overflow-y-auto h-full">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-white mb-2">Workspace Analytics</h1>
          <p className="text-slate-400 text-sm">Query performance and activity across all your connections</p>
        </div>
        <button
          onClick={fetchAnalytics}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/20 rounded-lg text-sm text-blue-400 transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        {stats.map((stat, index) => (
          <Card key={index} className="bg-[#273142] border-white/5 shadow-lg">
            <CardContent className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <p className="text-gray-400 text-sm mb-1">{stat.title}</p>
                  <h3 className="text-2xl font-bold text-white">{stat.value}</h3>
                </div>
                <div className={`p-3 rounded-2xl ${stat.color} bg-opacity-20`}>
                  <stat.icon className={`w-6 h-6 ${stat.color.replace('bg-', 'text-')}`} />
                </div>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <span className={`flex items-center ${stat.trend === 'up' ? 'text-green-400' : stat.trend === 'down' ? 'text-red-400' : 'text-gray-400'
                  }`}>
                  {stat.trend === 'up' && <ArrowUpRight className="w-4 h-4 mr-1" />}
                  {stat.trend === 'down' && <ArrowDownRight className="w-4 h-4 mr-1" />}
                  {stat.change}
                </span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Query Trends Chart */}
      <Card className="bg-[#273142] border-white/5 shadow-lg">
        <CardHeader>
          <CardTitle className="text-white text-lg font-medium flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-blue-400" />
            Query Trends (Last 30 Days)
          </CardTitle>
          <CardDescription className="text-slate-400">
            AI-generated vs manual queries over time
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] w-full">
            {queryTrends?.length > 0 ? (
              <Line options={commonOptions} data={queryTrendsData} />
            ) : (
              <div className="flex items-center justify-center h-full text-slate-500">
                No query data available
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Bottom Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
        {/* AI vs Manual Distribution */}
        <Card className="bg-[#273142] border-white/5 shadow-lg">
          <CardHeader>
            <CardTitle className="text-white text-lg font-medium">Query Distribution</CardTitle>
            <CardDescription className="text-slate-400">AI vs Manual queries</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[200px] relative flex items-center justify-center">
              <Doughnut options={doughnutOptions} data={aiVsManualData} />
              <div className="absolute inset-0 flex items-center justify-center flex-col pointer-events-none">
                <span className="text-2xl font-bold text-white">{summary?.totalQueries || 0}</span>
                <span className="text-xs text-slate-400">Total</span>
              </div>
            </div>
            <div className="mt-6 space-y-3">
              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-400 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-purple-500"></span> AI Generated
                </span>
                <span className="text-white font-medium">{summary?.aiQueries || 0}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-400 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-cyan-500"></span> Manual SQL
                </span>
                <span className="text-white font-medium">{summary?.manualQueries || 0}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Query Type Distribution */}
        <Card className="bg-[#273142] border-white/5 shadow-lg lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-white text-lg font-medium">Query Types</CardTitle>
            <CardDescription className="text-slate-400">Distribution by operation type</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[200px] w-full">
              {queryTypeDistribution?.length > 0 ? (
                <Bar options={commonOptions} data={queryTypeData} />
              ) : (
                <div className="flex items-center justify-center h-full text-slate-500">
                  No query type data available
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top Connections & Recent Queries */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
        {/* Top Connections */}
        <Card className="bg-[#273142] border-white/5 shadow-lg">
          <CardHeader>
            <CardTitle className="text-white text-lg font-medium">Top Connections</CardTitle>
            <CardDescription className="text-slate-400">Most queried databases</CardDescription>
          </CardHeader>
          <CardContent>
            {topConnections?.length > 0 ? (
              <div className="space-y-3">
                {topConnections.map((conn: any, idx: number) => (
                  <div key={idx} className="flex items-center justify-between p-3 bg-white/5 rounded-lg hover:bg-white/10 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center">
                        <Database className="w-4 h-4 text-blue-400" />
                      </div>
                      <div>
                        <p className="text-white font-medium text-sm">{conn.name}</p>
                        <p className="text-slate-400 text-xs">{conn.database_name}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-white font-bold">{parseInt(conn.query_count).toLocaleString()}</p>
                      <p className="text-slate-400 text-xs">{Math.round(conn.avg_execution_time || 0)}ms avg</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-slate-500 text-center py-8">No connection data</p>
            )}
          </CardContent>
        </Card>

        {/* Recent Queries */}
        <Card className="bg-[#273142] border-white/5 shadow-lg">
          <CardHeader>
            <CardTitle className="text-white text-lg font-medium">Recent Queries</CardTitle>
            <CardDescription className="text-slate-400">Latest SQL executions</CardDescription>
          </CardHeader>
          <CardContent>
            {recentQueries?.length > 0 ? (
              <div className="space-y-2 max-h-[300px] overflow-y-auto">
                {recentQueries.slice(0, 10).map((query: any, idx: number) => (
                  <div key={idx} className="p-3 bg-white/5 rounded-lg hover:bg-white/10 transition-colors">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <code className="text-xs text-slate-300 flex-1 line-clamp-2 font-mono">
                        {query.query_text}
                      </code>
                      {query.status === 'success' ? (
                        <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0" />
                      ) : (
                        <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
                      )}
                    </div>
                    <div className="flex items-center justify-between text-xs text-slate-400">
                      <span>{query.connection_name}</span>
                      <span>{query.execution_time_ms}ms</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-slate-500 text-center py-8">No recent queries</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Slowest Queries */}
      <Card className="bg-[#273142] border-white/5 shadow-lg">
        <CardHeader>
          <CardTitle className="text-white text-lg font-medium flex items-center gap-2">
            <Clock className="w-5 h-5 text-orange-400" />
            Slowest Queries
          </CardTitle>
          <CardDescription className="text-slate-400">
            Queries with the longest execution times
          </CardDescription>
        </CardHeader>
        <CardContent>
          {slowestQueries?.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="text-left border-b border-white/10">
                  <tr className="text-slate-400 text-xs">
                    <th className="pb-3 font-medium">Query</th>
                    <th className="pb-3 font-medium">Connection</th>
                    <th className="pb-3 font-medium text-right">Time</th>
                    <th className="pb-3 font-medium text-right">Rows</th>
                  </tr>
                </thead>
                <tbody className="text-sm">
                  {slowestQueries.map((query: any, idx: number) => (
                    <tr key={idx} className="border-b border-white/5 hover:bg-white/5">
                      <td className="py-3">
                        <code className="text-xs text-slate-300 line-clamp-2 font-mono">
                          {query.query_text}
                        </code>
                      </td>
                      <td className="py-3 text-slate-400">{query.connection_name}</td>
                      <td className="py-3 text-right">
                        <span className="text-orange-400 font-bold">{query.execution_time_ms}ms</span>
                      </td>
                      <td className="py-3 text-right text-slate-400">
                        {query.row_count?.toLocaleString() || 0}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-slate-500 text-center py-8">No query data</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
