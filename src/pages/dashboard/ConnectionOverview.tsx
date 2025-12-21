import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import {
  Table,
  HardDrive,
  Activity,
  Zap,
  Clock,
  BarChart3,
  TrendingUp,
  RefreshCw,
  Bot,
  Terminal,
  Bookmark,
  AlertTriangle,
  Play,
  Sparkles,
  MessageSquare,
  Database,
  History,
  Info
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip as ChartTooltip,
  Legend,
  BarElement,
  Filler,
  ArcElement,
} from 'chart.js';
import { Line, Doughnut, Bar } from 'react-chartjs-2';
import { connectionService } from '@/services/connection.service';
import { toast } from 'react-hot-toast';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  ChartTooltip,
  Legend,
  BarElement,
  Filler,
  ArcElement
);

const formatBytes = (bytes: number, decimals = 2) => {
  if (!bytes || bytes === 0) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
};

const formatDate = (dateStr: string) => {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

const formatTime = (dateStr: string) => {
  const date = new Date(dateStr);
  return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
};

const truncateQuery = (query: string, maxLength = 60) => {
  if (query.length <= maxLength) return query;
  return query.substring(0, maxLength) + '...';
};

export default function ConnectionOverview() {
  const { connectionId } = useParams<{ connectionId: string }>();
  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'chatsql' | 'database'>('chatsql');
  const [enablingExtension, setEnablingExtension] = useState(false);

  useEffect(() => {
    if (connectionId) {
      fetchAnalytics();
    }
  }, [connectionId]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const response = await connectionService.getConnectionAnalytics(connectionId!);
      if (response.success) {
        setAnalytics(response);
      }
    } catch (error: any) {
      console.error('Failed to fetch analytics:', error);
      toast.error('Failed to load database analytics');
    } finally {
      setLoading(false);
    }
  };

  const handleEnableExtension = async (extensionName: string) => {
    try {
      setEnablingExtension(true);
      const response = await connectionService.enableExtension(connectionId!, extensionName);
      if (response.success) {
        toast.success(response.message || `Extension ${extensionName} enabled!`);
        fetchAnalytics(); // Refresh data
      }
    } catch (error: any) {
      console.error('Failed to enable extension:', error);
      toast.error(error.response?.data?.error || `Failed to enable ${extensionName}`);
    } finally {
      setEnablingExtension(false);
    }
  };

  if (loading && !analytics) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="flex flex-col items-center gap-4">
          <RefreshCw className="w-8 h-8 text-blue-500 animate-spin" />
          <p className="text-slate-400 animate-pulse">Analyzing database performance...</p>
        </div>
      </div>
    );
  }

  if (!analytics) return null;

  const { databaseHealth, chatSqlActivity } = analytics;
  const { dbSize, activeConnections, cacheHitRatio, tableStats, pgStatStatements } = databaseHealth || {};
  const { summary, recentQueries, slowestQueries, topAiPrompts, topSqlQueries, queryTrends, mostQueriedTables } = chatSqlActivity || {};

  // Query Trends Chart Data
  const trendLabels = queryTrends?.map((t: any) => formatDate(t.date)) || [];
  const queryTrendsData = {
    labels: trendLabels,
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

  // Most Queried Tables via ChatSQL
  const chatSqlTablesData = {
    labels: mostQueriedTables?.map((t: any) => t.table_name) || [],
    datasets: [
      {
        label: 'AI Queries',
        data: mostQueriedTables?.map((t: any) => parseInt(t.ai_query_count)) || [],
        backgroundColor: 'rgba(139, 92, 246, 0.7)',
        borderColor: '#8b5cf6',
        borderWidth: 1,
      },
      {
        label: 'Manual Queries',
        data: mostQueriedTables?.map((t: any) => parseInt(t.query_count) - parseInt(t.ai_query_count)) || [],
        backgroundColor: 'rgba(6, 182, 212, 0.7)',
        borderColor: '#06b6d4',
        borderWidth: 1,
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

  // Hot Tables from DB (all traffic)
  const topTables = [...(tableStats || [])]
    .sort((a: any, b: any) => (b.total_reads + b.total_writes) - (a.total_reads + a.total_writes))
    .slice(0, 6);

  const hotTablesData = {
    labels: topTables.map((t: any) => t.table_name),
    datasets: [
      {
        label: 'Reads',
        data: topTables.map((t: any) => parseInt(t.total_reads)),
        backgroundColor: 'rgba(59, 130, 246, 0.6)',
        borderColor: '#3b82f6',
        borderWidth: 1,
      },
      {
        label: 'Writes',
        data: topTables.map((t: any) => parseInt(t.total_writes)),
        backgroundColor: 'rgba(16, 185, 129, 0.6)',
        borderColor: '#10b981',
        borderWidth: 1,
      },
    ],
  };

  const commonOptions: any = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: {
      y: {
        grid: { color: 'rgba(255, 255, 255, 0.05)' },
        ticks: { color: '#94a3b8', font: { size: 10 } },
        border: { display: false },
      },
      x: {
        grid: { display: false },
        ticks: { color: '#94a3b8', font: { size: 10 } },
        border: { display: false },
      },
    },
  };

  const doughnutOptions: any = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
  };

  return (
    <div className="p-4 md:p-8 space-y-6 pb-24 md:pb-8 overflow-y-auto h-full custom-scrollbar animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-white">Analytics Dashboard</h1>
          <p className="text-slate-400 text-sm mt-1">ChatSQL activity & database health insights</p>
        </div>
        <button
          onClick={fetchAnalytics}
          className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-sm text-slate-300 transition-colors w-fit"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-2 p-1 bg-white/5 rounded-xl w-fit">
        <button
          onClick={() => setActiveTab('chatsql')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'chatsql'
            ? 'bg-gradient-to-r from-purple-500/20 to-blue-500/20 text-white border border-purple-500/30'
            : 'text-slate-400 hover:text-white'
            }`}
        >
          <Bot className="w-4 h-4" />
          ChatSQL Activity
        </button>
        <button
          onClick={() => setActiveTab('database')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'database'
            ? 'bg-gradient-to-r from-emerald-500/20 to-cyan-500/20 text-white border border-emerald-500/30'
            : 'text-slate-400 hover:text-white'
            }`}
        >
          <Database className="w-4 h-4" />
          Database Health
        </button>
      </div>

      {/* ============================================ */}
      {/* CHATSQL ACTIVITY TAB */}
      {/* ============================================ */}
      {activeTab === 'chatsql' && (
        <div className="space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="bg-gradient-to-br from-purple-500/10 to-purple-900/20 border-purple-500/20 backdrop-blur-md">
              <CardContent className="pt-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-purple-500/20">
                    <Bot className="w-5 h-5 text-purple-400" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-white">{summary?.aiQueries || 0}</p>
                    <p className="text-xs text-slate-400">AI Queries</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-cyan-500/10 to-cyan-900/20 border-cyan-500/20 backdrop-blur-md">
              <CardContent className="pt-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-cyan-500/20">
                    <Terminal className="w-5 h-5 text-cyan-400" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-white">{summary?.manualQueries || 0}</p>
                    <p className="text-xs text-slate-400">Manual Queries</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-emerald-500/10 to-emerald-900/20 border-emerald-500/20 backdrop-blur-md">
              <CardContent className="pt-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-emerald-500/20">
                    <Bookmark className="w-5 h-5 text-emerald-400" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-white">{summary?.savedQueries || 0}</p>
                    <p className="text-xs text-slate-400">Saved Queries</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-red-500/10 to-red-900/20 border-red-500/20 backdrop-blur-md">
              <CardContent className="pt-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-red-500/20">
                    <AlertTriangle className="w-5 h-5 text-red-400" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-white">{summary?.errorCount || 0}</p>
                    <p className="text-xs text-slate-400">Errors</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* AI vs Manual Comparison */}
            <Card className="bg-[#1e293b]/50 border-white/5 backdrop-blur-md h-full flex flex-col">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-purple-400" />
                  AI vs Manual
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger>
                        <Info className="w-4 h-4 text-slate-500 hover:text-slate-300 transition-colors" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="w-[200px] text-xs">Comparison of queries generated by AI vs manually written SQL.</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </CardTitle>
                <CardDescription className="text-slate-400">Query source comparison</CardDescription>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col justify-center">
                <div className="h-[180px] relative w-full">
                  <Doughnut data={aiVsManualData} options={doughnutOptions} />
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
                    <span className="text-white font-medium">
                      {summary?.aiSuccessRate || 100}% success
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-slate-400 flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-cyan-500"></span> Manual SQL
                    </span>
                    <span className="text-white font-medium">
                      {summary?.manualSuccessRate || 100}% success
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Query Trends */}
            <Card className="lg:col-span-2 bg-[#1e293b]/50 border-white/5 backdrop-blur-md h-full flex flex-col">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-blue-400" />
                  Query Trends (7 days)
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger>
                        <Info className="w-4 h-4 text-slate-500 hover:text-slate-300 transition-colors" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="w-[200px] text-xs">Daily volume of AI and manual queries over the last 7 days.</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </CardTitle>
                <CardDescription className="text-slate-400">AI vs Manual queries over time</CardDescription>
              </CardHeader>
              <CardContent className="flex-1 min-h-[250px]">
                <div className="h-full w-full">
                  {queryTrends?.length > 0 ? (
                    <Line data={queryTrendsData} options={{ ...commonOptions, maintainAspectRatio: false }} />
                  ) : (
                    <div className="flex items-center justify-center h-full text-slate-500">
                      No query data in the last 7 days
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Top AI Prompts */}
            <Card className="lg:col-span-1 bg-[#1e293b]/50 border-white/5 backdrop-blur-md h-full flex flex-col">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-purple-400" />
                  Top AI Prompts
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger>
                        <Info className="w-4 h-4 text-slate-500 hover:text-slate-300 transition-colors" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="w-[200px] text-xs">Most frequently used natural language prompts.</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </CardTitle>
                <CardDescription className="text-slate-400">Most frequent intents</CardDescription>
              </CardHeader>
              <CardContent className="p-0 flex-1">
                {topAiPrompts?.length > 0 ? (
                  <div className="divide-y divide-white/5">
                    {topAiPrompts.map((prompt: any, idx: number) => (
                      <div key={idx} className="px-4 py-3 flex items-center justify-between hover:bg-white/5 transition-colors">
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <span className="text-xs font-bold text-purple-400 w-4">#{idx + 1}</span>
                          <p className="text-xs text-white truncate flex-1">{prompt.ai_prompt}</p>
                        </div>
                        <div className="flex items-center gap-2 text-[10px] text-slate-400">
                          <span className="flex items-center gap-1">
                            <Play className="w-2.5 h-2.5" /> {prompt.usage_count}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-6 text-center text-slate-500 text-xs h-full flex items-center justify-center">
                    No AI prompts yet.
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Top SQL Queries */}
            <Card className="lg:col-span-1 bg-[#1e293b]/50 border-white/5 backdrop-blur-md h-full flex flex-col">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Terminal className="w-4 h-4 text-cyan-400" />
                  Top SQL
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger>
                        <Info className="w-4 h-4 text-slate-500 hover:text-slate-300 transition-colors" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="w-[200px] text-xs">Most frequently executed SQL queries.</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </CardTitle>
                <CardDescription className="text-slate-400">Frequently used SQL</CardDescription>
              </CardHeader>
              <CardContent className="p-0 flex-1">
                {topSqlQueries?.length > 0 ? (
                  <div className="divide-y divide-white/5">
                    {topSqlQueries.map((q: any, idx: number) => (
                      <div key={idx} className="px-4 py-3 flex items-center justify-between hover:bg-white/5 transition-colors">
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <span className="text-xs font-bold text-cyan-400 w-4">#{idx + 1}</span>
                          <code className="text-[10px] text-slate-300 truncate flex-1 font-mono">{q.query_text}</code>
                        </div>
                        <div className="flex items-center gap-2 text-[10px] text-slate-400">
                          <span className="flex items-center gap-1">
                            <Play className="w-2.5 h-2.5" /> {q.usage_count}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-6 text-center text-slate-500 text-xs h-full flex items-center justify-center">
                    No SQL history yet.
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Most Queried Tables via ChatSQL */}
            <Card className="lg:col-span-1 bg-[#1e293b]/50 border-white/5 backdrop-blur-md h-full flex flex-col">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Table className="w-4 h-4 text-cyan-400" />
                  Hot Tables
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger>
                        <Info className="w-4 h-4 text-slate-500 hover:text-slate-300 transition-colors" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="w-[200px] text-xs">Tables most frequently accessed via ChatSQL queries.</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </CardTitle>
                <CardDescription className="text-slate-400">Most queried via ChatSQL</CardDescription>
              </CardHeader>
              <CardContent className="flex-1 min-h-[200px]">
                <div className="h-full w-full">
                  {mostQueriedTables?.length > 0 ? (
                    <Bar data={chatSqlTablesData} options={{
                      ...commonOptions,
                      maintainAspectRatio: false,
                      scales: {
                        ...commonOptions.scales,
                        x: { ...commonOptions.scales.x, display: false }
                      }
                    }} />
                  ) : (
                    <div className="flex items-center justify-center h-full text-slate-500 text-xs">
                      No table usage data yet
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Recent Queries */}
            <Card className="lg:col-span-3 bg-[#1e293b]/50 border-white/5 backdrop-blur-md">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-white flex items-center gap-2">
                    <History className="w-4 h-4 text-slate-400" />
                    Recent Queries
                  </CardTitle>
                  <CardDescription className="text-slate-400">Your latest ChatSQL activity</CardDescription>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                {recentQueries?.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                      <thead className="bg-white/5 text-slate-400 font-medium">
                        <tr>
                          <th className="px-6 py-3">Query</th>
                          <th className="px-6 py-3">Source</th>
                          <th className="px-6 py-3">Time</th>
                          <th className="px-6 py-3">Rows</th>
                          <th className="px-6 py-3">Status</th>
                          <th className="px-6 py-3">When</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5">
                        {recentQueries.map((q: any, idx: number) => (
                          <tr key={idx} className="hover:bg-white/5 transition-colors group">
                            <td className="px-6 py-3">
                              <div className="flex flex-col gap-1 max-w-[300px]">
                                <code className="text-xs text-slate-300 font-mono truncate">
                                  {truncateQuery(q.query_text)}
                                </code>
                                {q.is_ai_generated && q.ai_prompt && (
                                  <span className="text-[10px] text-purple-400 truncate">
                                    "{q.ai_prompt}"
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="px-6 py-3">
                              {q.is_ai_generated ? (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-purple-500/10 text-purple-400 border border-purple-500/20">
                                  <Bot className="w-3 h-3" /> AI
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                                  <Terminal className="w-3 h-3" /> Manual
                                </span>
                              )}
                            </td>
                            <td className="px-6 py-3 text-slate-400">{q.execution_time_ms}ms</td>
                            <td className="px-6 py-3 text-slate-400">{q.row_count || '-'}</td>
                            <td className="px-6 py-3">
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${q.status === 'success'
                                ? 'bg-emerald-500/10 text-emerald-400'
                                : 'bg-red-500/10 text-red-400'
                                }`}>
                                {q.status}
                              </span>
                            </td>
                            <td className="px-6 py-3 text-slate-500 text-xs">
                              {formatTime(q.created_at)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="p-6 text-center text-slate-500">
                    No queries yet. Start exploring your data!
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Slowest Queries */}
            {slowestQueries?.length > 0 && (
              <Card className="lg:col-span-3 bg-gradient-to-br from-orange-500/5 to-red-500/5 border-orange-500/20">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-orange-400" />
                    Slowest Queries
                  </CardTitle>
                  <CardDescription className="text-slate-400">Queries that took the longest to execute</CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                      <thead className="bg-white/5 text-slate-400 font-medium">
                        <tr>
                          <th className="px-6 py-3">Query</th>
                          <th className="px-6 py-3">Source</th>
                          <th className="px-6 py-3">Execution Time</th>
                          <th className="px-6 py-3">When</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5">
                        {slowestQueries.map((q: any, idx: number) => (
                          <tr key={idx} className="hover:bg-white/5 transition-colors">
                            <td className="px-6 py-3">
                              <code className="text-xs text-slate-300 font-mono">
                                {truncateQuery(q.query_text, 80)}
                              </code>
                            </td>
                            <td className="px-6 py-3">
                              {q.is_ai_generated ? (
                                <span className="text-purple-400 text-xs">AI</span>
                              ) : (
                                <span className="text-cyan-400 text-xs">Manual</span>
                              )}
                            </td>
                            <td className="px-6 py-3">
                              <span className="text-orange-400 font-bold">{q.execution_time_ms}ms</span>
                            </td>
                            <td className="px-6 py-3 text-slate-500 text-xs">
                              {formatDate(q.created_at)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      )}

      {/* ============================================ */}
      {/* DATABASE HEALTH TAB */}
      {/* ============================================ */}
      {activeTab === 'database' && (
        <div className="space-y-6">
          {/* Database Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="bg-[#1e293b]/50 border-white/5 backdrop-blur-md">
              <CardContent className="pt-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-blue-500/20">
                    <Table className="w-5 h-5 text-blue-400" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-white">{tableStats?.length || 0}</p>
                    <p className="text-xs text-slate-400">Total Tables</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-[#1e293b]/50 border-white/5 backdrop-blur-md">
              <CardContent className="pt-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-emerald-500/20">
                    <HardDrive className="w-5 h-5 text-emerald-400" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-white">{formatBytes(dbSize || 0)}</p>
                    <p className="text-xs text-slate-400">Database Size</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-[#1e293b]/50 border-white/5 backdrop-blur-md">
              <CardContent className="pt-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-orange-500/20">
                    <Activity className="w-5 h-5 text-orange-400" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-white">{activeConnections || 0}</p>
                    <p className="text-xs text-slate-400">Active Connections</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-[#1e293b]/50 border-white/5 backdrop-blur-md">
              <CardContent className="pt-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-yellow-500/20">
                    <Zap className="w-5 h-5 text-yellow-400" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-white">{cacheHitRatio?.toFixed(1) || 0}%</p>
                    <p className="text-xs text-slate-400">Cache Hit Ratio</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Hot Tables (All DB Traffic) */}
            <Card className="lg:col-span-2 bg-[#1e293b]/50 border-white/5 backdrop-blur-md h-full flex flex-col">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-blue-400" />
                  Hot Tables (All Traffic)
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger>
                        <Info className="w-4 h-4 text-slate-500 hover:text-slate-300 transition-colors" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="w-[200px] text-xs">Most active tables by read/write volume (from all sources hitting your DB).</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </CardTitle>
                <CardDescription className="text-slate-400">
                  Most active tables by read/write volume (from all sources hitting your DB)
                </CardDescription>
              </CardHeader>
              <CardContent className="flex-1 min-h-[280px]">
                <div className="h-full w-full">
                  {topTables.length > 0 ? (
                    <Bar data={hotTablesData} options={{ ...commonOptions, maintainAspectRatio: false }} />
                  ) : (
                    <div className="flex items-center justify-center h-full text-slate-500">
                      No table statistics available
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Cache Performance */}
            <Card className="lg:col-span-1 bg-[#1e293b]/50 border-white/5 backdrop-blur-md h-full flex flex-col">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Zap className="w-4 h-4 text-yellow-400" />
                  Cache Performance
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger>
                        <Info className="w-4 h-4 text-slate-500 hover:text-slate-300 transition-colors" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="w-[200px] text-xs">Percentage of data requests served from RAM (fast) vs Disk (slow). Aim for &gt; 90%.</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </CardTitle>
                <CardDescription className="text-slate-400">Data served from RAM vs Disk</CardDescription>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col justify-center">
                <div className="space-y-6">
                  <div className="text-center">
                    <p className="text-5xl font-bold text-white">{cacheHitRatio?.toFixed(1) || 0}%</p>
                    <p className={`text-sm mt-2 ${(cacheHitRatio || 0) > 90 ? 'text-emerald-400' : (cacheHitRatio || 0) > 70 ? 'text-yellow-400' : 'text-red-400'}`}>
                      {(cacheHitRatio || 0) > 90 ? '✅ Excellent' : (cacheHitRatio || 0) > 70 ? '⚠️ Good' : '❌ Needs Work'}
                    </p>
                  </div>
                  <div className="w-full h-3 bg-white/10 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${(cacheHitRatio || 0) > 90 ? 'bg-emerald-500' : (cacheHitRatio || 0) > 70 ? 'bg-yellow-500' : 'bg-red-500'}`}
                      style={{ width: `${cacheHitRatio || 0}%` }}
                    ></div>
                  </div>
                  <p className="text-xs text-slate-500 text-center">
                    {(cacheHitRatio || 0) > 90
                      ? 'Your data is being served efficiently from memory.'
                      : 'Consider adding more RAM or optimizing queries.'}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Database-wide Query Analytics (pg_stat_statements) */}
            <Card className="lg:col-span-3 bg-[#1e293b]/50 border-white/5 backdrop-blur-md overflow-hidden">
              <CardHeader className="border-b border-white/5 bg-white/[0.02]">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <CardTitle className="text-white flex items-center gap-2">
                      <Zap className="w-4 h-4 text-yellow-400" />
                      Database-wide Query Performance
                    </CardTitle>
                    <CardDescription className="text-slate-400">
                      Top queries by total execution time across your entire database
                    </CardDescription>
                  </div>
                  {!pgStatStatements || pgStatStatements.length === 0 ? (
                    <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-[10px] text-amber-400 w-fit">
                      <AlertTriangle className="w-3 h-3" />
                      Extension not enabled
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[10px] text-emerald-400 w-fit">
                      <Activity className="w-3 h-3" />
                      Monitoring Active
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent className="p-0">
                {pgStatStatements && pgStatStatements.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                      <thead className="bg-white/5 text-slate-400 font-medium">
                        <tr>
                          <th className="px-6 py-3">Query</th>
                          <th className="px-6 py-3 text-right">Calls</th>
                          <th className="px-6 py-3 text-right">Avg Time</th>
                          <th className="px-6 py-3 text-right">Total Time</th>
                          <th className="px-6 py-3 text-right">Rows</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5">
                        {pgStatStatements.map((q: any, idx: number) => (
                          <tr key={idx} className="hover:bg-white/5 transition-colors">
                            <td className="px-6 py-3">
                              <code className="text-xs text-slate-300 font-mono block max-w-[500px] truncate">
                                {q.query}
                              </code>
                            </td>
                            <td className="px-6 py-3 text-right text-slate-400">{q.calls}</td>
                            <td className="px-6 py-3 text-right text-slate-300 font-medium">{Math.round(q.avg_time_ms)}ms</td>
                            <td className="px-6 py-3 text-right text-orange-400 font-bold">
                              {q.total_time_ms > 1000 ? `${(q.total_time_ms / 1000).toFixed(1)}s` : `${Math.round(q.total_time_ms)}ms`}
                            </td>
                            <td className="px-6 py-3 text-right text-slate-400">{q.rows}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="p-8 md:p-12 text-center space-y-6">
                    <div className="inline-flex p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20">
                      <Terminal className="w-8 h-8 text-amber-500" />
                    </div>
                    <div className="max-w-md mx-auto space-y-4">
                      <div>
                        <h3 className="text-white font-semibold text-lg">Enable Query Monitoring</h3>
                        <p className="text-slate-400 text-sm mt-2">
                          To see performance data for all queries hitting your database, you need to enable the
                          <code className="mx-1 px-1 py-0.5 bg-white/5 rounded text-purple-400">pg_stat_statements</code>
                          extension.
                        </p>
                      </div>

                      <div className="p-4 rounded-xl bg-red-500/5 border border-red-500/20 text-left">
                        <div className="flex gap-3">
                          <AlertTriangle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
                          <div className="text-xs space-y-1">
                            <p className="text-red-400 font-bold uppercase tracking-wider">Warning</p>
                            <p className="text-slate-400 leading-relaxed">
                              Enabling this extension will cause the database to track and store metadata for every SQL query executed.
                              While the overhead is minimal (typically &lt; 1%), it does consume some memory and storage for the statistics.
                            </p>
                          </div>
                        </div>
                      </div>

                      <button
                        onClick={() => handleEnableExtension('pg_stat_statements')}
                        disabled={enablingExtension}
                        className="w-full md:w-auto px-8 py-3 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white rounded-xl font-medium transition-all shadow-lg shadow-purple-500/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                      >
                        {enablingExtension ? (
                          <>
                            <RefreshCw className="w-4 h-4 animate-spin" />
                            Enabling Extension...
                          </>
                        ) : (
                          <>
                            <Zap className="w-4 h-4" />
                            Enable & Configure Now
                          </>
                        )}
                      </button>

                      <p className="text-[10px] text-slate-500">
                        Note: This requires your database user to have superuser or CREATE EXTENSION privileges.
                      </p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Table Health / Bloat */}
            <Card className="lg:col-span-3 bg-[#1e293b]/50 border-white/5 backdrop-blur-md">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-orange-400" />
                  Table Health & Bloat
                </CardTitle>
                <CardDescription className="text-slate-400">
                  Tables with high dead tuple counts may need VACUUM
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-white/5 text-slate-400 font-medium">
                      <tr>
                        <th className="px-6 py-3">Table Name</th>
                        <th className="px-6 py-3">Schema</th>
                        <th className="px-6 py-3">Row Count</th>
                        <th className="px-6 py-3">Size</th>
                        <th className="px-6 py-3">
                          <div className="flex items-center gap-2">
                            Dead Rows
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger>
                                  <Info className="w-4 h-4 text-slate-500 hover:text-slate-300 transition-colors" />
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p className="w-[200px] text-xs">Rows that have been deleted or updated but not yet removed from the disk. High numbers can slow down queries.</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          </div>
                        </th>
                        <th className="px-6 py-3">
                          <div className="flex items-center gap-2">
                            Bloat %
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger>
                                  <Info className="w-4 h-4 text-slate-500 hover:text-slate-300 transition-colors" />
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p className="w-[200px] text-xs">The percentage of the table size that is occupied by dead rows. High bloat means wasted space and slower performance.</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          </div>
                        </th>
                        <th className="px-6 py-3">
                          <div className="flex items-center gap-2">
                            Status
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger>
                                  <Info className="w-4 h-4 text-slate-500 hover:text-slate-300 transition-colors" />
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p className="w-[200px] text-xs">Recommendation based on bloat percentage. 'Vacuum' means you should run the VACUUM command to reclaim space.</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          </div>
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {[...(tableStats || [])]
                        .sort((a: any, b: any) => b.dead_rows - a.dead_rows)
                        .slice(0, 10)
                        .map((table: any, idx: number) => {
                          const bloatRatio = table.row_count > 0 ? (table.dead_rows / table.row_count) * 100 : 0;
                          return (
                            <tr key={idx} className="hover:bg-white/5 transition-colors">
                              <td className="px-6 py-4 font-medium text-white">{table.table_name}</td>
                              <td className="px-6 py-4 text-slate-400">{table.schema_name}</td>
                              <td className="px-6 py-4 text-slate-400">{parseInt(table.row_count).toLocaleString()}</td>
                              <td className="px-6 py-4 text-slate-400">{formatBytes(table.table_size_bytes)}</td>
                              <td className="px-6 py-4 text-slate-400">{parseInt(table.dead_rows).toLocaleString()}</td>
                              <td className="px-6 py-4">
                                <span className={bloatRatio > 20 ? 'text-red-400' : bloatRatio > 10 ? 'text-yellow-400' : 'text-emerald-400'}>
                                  {bloatRatio.toFixed(1)}%
                                </span>
                              </td>
                              <td className="px-6 py-4">
                                <span className={`px-2 py-1 rounded-full text-[10px] font-bold ${bloatRatio > 20 ? 'bg-red-500/10 text-red-400' :
                                  bloatRatio > 10 ? 'bg-yellow-500/10 text-yellow-400' :
                                    'bg-emerald-500/10 text-emerald-400'
                                  }`}>
                                  {bloatRatio > 20 ? 'Critical' : bloatRatio > 10 ? 'Vacuum' : 'Healthy'}
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
