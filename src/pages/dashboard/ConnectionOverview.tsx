import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import {
  Database,
  Table,
  HardDrive,
  Activity,
  ArrowUpRight,
  ArrowDownRight,
  Zap,
  AlertCircle,
  Clock,
  BarChart3,
  TrendingUp,
  MousePointer2,
  RefreshCw
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
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
import { connectionService } from '@/services/connection.service';
import { toast } from 'react-hot-toast';

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

const formatBytes = (bytes: number, decimals = 2) => {
  if (!bytes || bytes === 0) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
};

export default function ConnectionOverview() {
  const { connectionId } = useParams<{ connectionId: string }>();
  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState<any>(null);

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

  const { dbSize, activeConnections, cacheHitRatio, tableStats, queryStats } = analytics;

  // Hot Tables Data (Bar Chart)
  const topTables = [...tableStats]
    .sort((a, b) => (b.total_reads + b.total_writes) - (a.total_reads + a.total_writes))
    .slice(0, 6);

  const hotTablesData = {
    labels: topTables.map(t => t.table_name),
    datasets: [
      {
        label: 'Reads',
        data: topTables.map(t => t.total_reads),
        backgroundColor: 'rgba(59, 130, 246, 0.6)',
        borderColor: '#3b82f6',
        borderWidth: 1,
      },
      {
        label: 'Writes',
        data: topTables.map(t => t.total_writes),
        backgroundColor: 'rgba(16, 185, 129, 0.6)',
        borderColor: '#10b981',
        borderWidth: 1,
      },
    ],
  };

  // Query Distribution (Doughnut)
  const totalOps = tableStats.reduce((acc: any, t: any) => ({
    ins: acc.ins + parseInt(t.insertions),
    upd: acc.upd + parseInt(t.updates),
    del: acc.del + parseInt(t.deletions),
    read: acc.read + parseInt(t.total_reads)
  }), { ins: 0, upd: 0, del: 0, read: 0 });

  const queryDistributionData = {
    labels: ['Reads', 'Inserts', 'Updates', 'Deletes'],
    datasets: [
      {
        data: [totalOps.read, totalOps.ins, totalOps.upd, totalOps.del],
        backgroundColor: ['#3b82f6', '#10b981', '#f59e0b', '#ef4444'],
        borderWidth: 0,
        cutout: '75%',
      },
    ],
  };

  const commonOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
    },
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

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
    },
  };

  return (
    <div className="p-4 md:p-8 space-y-6 md:space-y-8 pb-24 md:pb-8 overflow-y-auto h-full custom-scrollbar">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-white">Connection Overview</h1>
          <p className="text-slate-400 text-sm mt-1">Real-time performance metrics and AI insights</p>
        </div>
        <button
          onClick={fetchAnalytics}
          className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-sm text-slate-300 transition-colors w-fit"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh Stats
        </button>
      </div>

      {/* Vital Signs Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        <Card className="bg-[#1e293b]/50 border-white/5 shadow-xl backdrop-blur-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-400">Total Tables</CardTitle>
            <Table className="h-4 w-4 text-blue-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{tableStats.length}</div>
            <p className="text-xs text-slate-500 mt-1">Across all synced schemas</p>
          </CardContent>
        </Card>

        <Card className="bg-[#1e293b]/50 border-white/5 shadow-xl backdrop-blur-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-400">Database Size</CardTitle>
            <HardDrive className="h-4 w-4 text-emerald-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{formatBytes(dbSize)}</div>
            <p className="text-xs text-emerald-500 mt-1 flex items-center">
              <TrendingUp className="w-3 h-3 mr-1" />
              Live storage usage
            </p>
          </CardContent>
        </Card>

        <Card className="bg-[#1e293b]/50 border-white/5 shadow-xl backdrop-blur-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-400">Active Connections</CardTitle>
            <Activity className="h-4 w-4 text-orange-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{activeConnections}</div>
            <p className="text-xs text-slate-500 mt-1">Current sessions</p>
          </CardContent>
        </Card>

        <Card className="bg-[#1e293b]/50 border-white/5 shadow-xl backdrop-blur-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-400">Cache Hit Ratio</CardTitle>
            <Zap className="h-4 w-4 text-yellow-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{cacheHitRatio.toFixed(1)}%</div>
            <p className={`text-xs mt-1 ${cacheHitRatio > 90 ? 'text-emerald-500' : 'text-orange-500'}`}>
              {cacheHitRatio > 90 ? 'Excellent performance' : 'Needs optimization'}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* AI Insights Card */}
        <Card className="lg:col-span-1 bg-gradient-to-br from-blue-600/10 to-purple-600/10 border-blue-500/20 shadow-xl backdrop-blur-md">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-blue-400 fill-blue-400/20" />
              <CardTitle className="text-white">AI Insights</CardTitle>
            </div>
            <CardDescription className="text-slate-400">AI query performance & efficiency</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-sm text-slate-400">AI Success Rate</p>
                <p className="text-2xl font-bold text-white">{queryStats.aiSuccessRate}%</p>
              </div>
              <div className="w-12 h-12 rounded-full border-4 border-blue-500/20 border-t-blue-500 flex items-center justify-center">
                <span className="text-[10px] font-bold text-blue-400">{queryStats.aiSuccessRate}%</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 rounded-xl bg-white/5 border border-white/5">
                <div className="flex items-center gap-2 text-slate-400 mb-1">
                  <Clock className="w-3 h-3" />
                  <span className="text-[10px] uppercase tracking-wider font-semibold">Avg Time</span>
                </div>
                <p className="text-lg font-bold text-white">{queryStats.avgExecutionTime}ms</p>
              </div>
              <div className="p-3 rounded-xl bg-white/5 border border-white/5">
                <div className="flex items-center gap-2 text-slate-400 mb-1">
                  <BarChart3 className="w-3 h-3" />
                  <span className="text-[10px] uppercase tracking-wider font-semibold">AI Queries</span>
                </div>
                <p className="text-lg font-bold text-white">{queryStats.aiQueries}</p>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex justify-between text-xs">
                <span className="text-slate-400">Total Queries</span>
                <span className="text-white font-medium">{queryStats.totalQueries}</span>
              </div>
              <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-500 rounded-full"
                  style={{ width: `${(queryStats.aiQueries / queryStats.totalQueries) * 100}%` }}
                ></div>
              </div>
              <p className="text-[10px] text-slate-500 text-center">
                AI accounts for {Math.round((queryStats.aiQueries / queryStats.totalQueries) * 100 || 0)}% of total activity
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Hot Tables Chart */}
        <Card className="lg:col-span-2 bg-[#1e293b]/50 border-white/5 shadow-xl backdrop-blur-sm">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-white">Hot Tables</CardTitle>
              <CardDescription className="text-slate-400">Most active tables by read/write volume</CardDescription>
            </div>
            <BarChart3 className="w-5 h-5 text-slate-500" />
          </CardHeader>
          <CardContent>
            <div className="h-[280px]">
              <Bar data={hotTablesData} options={commonOptions} />
            </div>
          </CardContent>
        </Card>

        {/* Query Distribution */}
        <Card className="bg-[#1e293b]/50 border-white/5 shadow-xl backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-white">Operation Intensity</CardTitle>
            <CardDescription className="text-slate-400">Read vs Write distribution</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[200px] relative">
              <Doughnut data={queryDistributionData} options={doughnutOptions} />
              <div className="absolute inset-0 flex items-center justify-center flex-col pointer-events-none">
                <span className="text-3xl font-bold text-white">
                  {Math.round((totalOps.read / (totalOps.read + totalOps.ins + totalOps.upd + totalOps.del)) * 100 || 0)}%
                </span>
                <span className="text-xs text-slate-400">Reads</span>
              </div>
            </div>
            <div className="mt-6 space-y-2">
              {[
                { label: 'Reads', value: totalOps.read, color: '#3b82f6' },
                { label: 'Inserts', value: totalOps.ins, color: '#10b981' },
                { label: 'Updates', value: totalOps.upd, color: '#f59e0b' },
                { label: 'Deletes', value: totalOps.del, color: '#ef4444' },
              ].map((op) => (
                <div key={op.label} className="flex justify-between text-sm">
                  <span className="text-slate-400 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: op.color }}></span> {op.label}
                  </span>
                  <span className="text-white font-medium">
                    {Math.round((op.value / (totalOps.read + totalOps.ins + totalOps.upd + totalOps.del)) * 100 || 0)}%
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Table Health / Bloat */}
        <Card className="lg:col-span-2 bg-[#1e293b]/50 border-white/5 shadow-xl backdrop-blur-sm overflow-hidden">
          <CardHeader>
            <CardTitle className="text-white">Table Health & Bloat</CardTitle>
            <CardDescription className="text-slate-400">Top tables by dead tuple count (needs vacuum)</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-white/5 text-slate-400 font-medium">
                  <tr>
                    <th className="px-6 py-3">Table Name</th>
                    <th className="px-6 py-3">Row Count</th>
                    <th className="px-6 py-3">Size</th>
                    <th className="px-6 py-3">Dead Rows</th>
                    <th className="px-6 py-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {[...tableStats]
                    .sort((a, b) => b.dead_rows - a.dead_rows)
                    .slice(0, 5)
                    .map((table, idx) => {
                      const bloatRatio = table.row_count > 0 ? (table.dead_rows / table.row_count) * 100 : 0;
                      return (
                        <tr key={idx} className="hover:bg-white/5 transition-colors">
                          <td className="px-6 py-4 font-medium text-white">{table.table_name}</td>
                          <td className="px-6 py-4 text-slate-400">{parseInt(table.row_count).toLocaleString()}</td>
                          <td className="px-6 py-4 text-slate-400">{formatBytes(table.table_size_bytes)}</td>
                          <td className="px-6 py-4 text-slate-400">{parseInt(table.dead_rows).toLocaleString()}</td>
                          <td className="px-6 py-4">
                            <span className={`px-2 py-1 rounded-full text-[10px] font-bold ${bloatRatio > 20 ? 'bg-red-500/10 text-red-500' :
                                bloatRatio > 10 ? 'bg-yellow-500/10 text-yellow-500' :
                                  'bg-emerald-500/10 text-emerald-500'
                              }`}>
                              {bloatRatio > 20 ? 'Critical Bloat' : bloatRatio > 10 ? 'Needs Vacuum' : 'Healthy'}
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
  );
}
