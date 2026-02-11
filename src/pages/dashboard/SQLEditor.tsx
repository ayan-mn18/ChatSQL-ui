import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Play, Sparkles, Save, Download, BarChart3, Table as TableIcon, ChevronRight, ChevronLeft, AlertCircle, ArrowUpDown, Filter, MoreHorizontal, ChevronDown, Lock, Zap } from 'lucide-react';
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '@/components/ui/resizable';
import DataTable from '@/components/DataTable';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Parser } from 'node-sql-parser';
import Editor from 'react-simple-code-editor';
import Prism from '@/lib/prism-setup';
import 'prismjs/components/prism-sql';
import 'prismjs/themes/prism-tomorrow.css';
import { useReadOnlyStatusQuery } from '@/hooks/useQueries';

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  PointElement,
  LineElement,
  ArcElement,
} from 'chart.js';
import { Bar, Line, Doughnut } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  PointElement,
  LineElement,
  ArcElement
);

import { mockDatabase } from '@/lib/mockData';

// Read-only mode upgrade banner component
function ReadOnlyBanner({ onUpgrade }: { onUpgrade: () => void }) {
  return (
    <div className="bg-gradient-to-r from-amber-500/20 via-orange-500/20 to-red-500/20 border-b border-amber-500/30 px-4 py-3 flex items-center justify-between gap-4">
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-full bg-amber-500/20">
          <Lock className="w-4 h-4 text-amber-400" />
        </div>
        <div>
          <p className="text-sm font-medium text-amber-300">
            Read-Only Mode Active
          </p>
          <p className="text-xs text-amber-400/80">
            You've exhausted your free tier. Only SELECT queries are allowed. Upgrade to unlock full access.
          </p>
        </div>
      </div>
      <Button
        size="sm"
        onClick={onUpgrade}
        className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white shrink-0"
      >
        <Zap className="w-4 h-4 mr-2" />
        Upgrade Now
      </Button>
    </div>
  );
}

export default function SQLEditor() {
  const navigate = useNavigate();
  const [query, setQuery] = useState(`SELECT 
  o.id,
  u.first_name || ' ' || u.last_name as customer,
  o.status,
  o.total_amount,
  o.created_at
FROM orders o
JOIN users u ON o.user_id = u.id
ORDER BY o.created_at DESC
LIMIT 100;`);
  const [aiPrompt, setAiPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isAiOpen, setIsAiOpen] = useState(false);
  const [, setActiveTab] = useState('table');
  const [error, setError] = useState<string | null>(null);

  // Read-only status via TanStack Query
  const { data: readOnlyData } = useReadOnlyStatusQuery();
  const isReadOnly = readOnlyData?.data?.isReadOnly || false;

  const parser = new Parser();

  // Helper to check if query is SELECT only
  const isSelectOnlyQuery = (sql: string): boolean => {
    const trimmed = sql.trim().toUpperCase();
    const dangerousKeywords = ['INSERT', 'UPDATE', 'DELETE', 'DROP', 'TRUNCATE', 'ALTER', 'CREATE', 'GRANT', 'REVOKE'];
    return !dangerousKeywords.some(keyword =>
      trimmed.startsWith(keyword) || trimmed.includes(` ${keyword} `)
    );
  };

  const validateSQL = (sql: string) => {
    if (!sql.trim()) {
      setError(null);
      return;
    }
    try {
      parser.astify(sql, { database: 'postgresql' });
      setError(null);
    } catch (err: any) {
      // The error message from node-sql-parser can be verbose
      // err.message usually looks like "Expected ..., ... but found ..."
      // We can clean it up or display it directly.
      setError(`Syntax Error: ${err.message}`);
    }
  };

  const handleQueryChange = (newQuery: string) => {
    setQuery(newQuery);
    validateSQL(newQuery);
  };

  // Transform mock data for display
  const results = useMemo(() => {
    return mockDatabase.orders.map(order => {
      const user = mockDatabase.users.find(u => u.id === order.user_id);
      return {
        id: order.id,
        customer: user ? `${user.first_name} ${user.last_name}` : 'Unknown',
        status: order.status,
        total_amount: `$${order.total_amount.toLocaleString()}`,
        created_at: new Date(order.created_at).toLocaleDateString(),
      };
    });
  }, []);

  const columns = ['id', 'customer', 'status', 'total_amount', 'created_at'];

  // Chart 1: Revenue Trends (Line)
  const lineChartData = {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
    datasets: [
      {
        label: 'Electronics',
        data: [95000, 102000, 111000, 125000, 132000, 145000],
        borderColor: '#8b5cf6', // Violet
        backgroundColor: 'rgba(139, 92, 246, 0.1)',
        tension: 0.4,
        fill: true,
        pointBackgroundColor: '#1e293b',
        pointBorderColor: '#8b5cf6',
        pointBorderWidth: 2,
        pointRadius: 4,
        pointHoverRadius: 6,
      },
      {
        label: 'Fashion',
        data: [82000, 85000, 90500, 98000, 95000, 105000],
        borderColor: '#06b6d4', // Cyan
        backgroundColor: 'rgba(6, 182, 212, 0.1)',
        tension: 0.4,
        fill: true,
        pointBackgroundColor: '#1e293b',
        pointBorderColor: '#06b6d4',
        pointBorderWidth: 2,
        pointRadius: 4,
        pointHoverRadius: 6,
      },
    ],
  };

  // Chart 2: Category Distribution (Doughnut)
  const doughnutChartData = {
    labels: ['Electronics', 'Fashion', 'Home', 'Sports', 'Books'],
    datasets: [
      {
        data: [35, 25, 20, 15, 5],
        backgroundColor: [
          '#8b5cf6', // Violet
          '#06b6d4', // Cyan
          '#10b981', // Emerald
          '#f59e0b', // Amber
          '#6366f1', // Indigo
        ],
        borderWidth: 0,
        hoverOffset: 4,
      },
    ],
  };

  // Chart 3: Monthly Growth (Bar)
  const barChartData = {
    labels: ['Electronics', 'Fashion', 'Home', 'Sports', 'Books'],
    datasets: [
      {
        label: 'Growth Rate (%)',
        data: [12.5, 8.2, -2.4, 15.1, 2.1],
        backgroundColor: (context: any) => {
          const value = context.raw;
          return value >= 0 ? '#10b981' : '#ef4444';
        },
        borderRadius: 6,
        barThickness: 32,
      },
    ],
  };

  const commonOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
        align: 'end' as const,
        labels: {
          color: '#94a3b8',
          font: { size: 11, family: '"Inter", sans-serif' },
          usePointStyle: true,
          boxWidth: 6,
        }
      },
      tooltip: {
        backgroundColor: '#1e293b',
        titleColor: '#f8fafc',
        bodyColor: '#cbd5e1',
        borderColor: 'rgba(255,255,255,0.1)',
        borderWidth: 1,
        padding: 10,
        cornerRadius: 8,
        displayColors: true,
      }
    },
    scales: {
      y: {
        grid: { color: 'rgba(255, 255, 255, 0.04)' },
        ticks: { color: '#94a3b8', font: { size: 10 } },
        border: { display: false },
      },
      x: {
        grid: { display: false },
        ticks: { color: '#94a3b8', font: { size: 10 } },
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
    cutout: '75%',
    plugins: {
      legend: {
        position: 'right' as const,
        labels: {
          color: '#94a3b8',
          font: { size: 11, family: '"Inter", sans-serif' },
          usePointStyle: true,
          boxWidth: 6,
        }
      },
    },
  };

  const handleGenerateSQL = () => {
    if (!aiPrompt) return;
    setIsGenerating(true);
    setError(null);
    // Simulate AI delay
    setTimeout(() => {
      setQuery(`-- Generated from: "${aiPrompt}"\nSELECT * FROM orders WHERE status = 'pending' AND created_at > NOW() - INTERVAL '7 days';`);
      setIsGenerating(false);
      setIsAiOpen(false);
    }, 1500);
  };

  const handleRunQuery = () => {
    // If there is already a syntax error, don't run
    if (error) {
      return;
    }
    if (!query.trim()) {
      setError('Query cannot be empty');
      return;
    }
    // Check read-only mode enforcement
    if (isReadOnly && !isSelectOnlyQuery(query)) {
      setError('Read-only mode: Only SELECT queries are allowed. Upgrade to run INSERT, UPDATE, DELETE queries.');
      return;
    }
    // Otherwise success (no-op for mock)
    console.log('Running query:', query);
  };

  // Line numbers generator
  const lineNumbers = query.split('\n').map((_, i) => i + 1);

  return (
    <div className="h-screen flex flex-col bg-[#1B2431]">
      {/* Read-only Mode Banner */}
      {isReadOnly && (
        <ReadOnlyBanner onUpgrade={() => navigate('/dashboard/pricing')} />
      )}

      {/* Toolbar */}
      <div className="h-16 border-b border-white/5 flex items-center justify-between px-4 md:px-6 bg-[#1B2431] shrink-0">
        <div className="flex items-center gap-3">
          <Button
            size="sm"
            className="bg-[#10b981] hover:bg-[#059669] text-white shadow-lg shadow-green-500/20 transition-all hover:scale-105"
            onClick={handleRunQuery}
          >
            <Play className="w-4 h-4 mr-2" />
            <span className="hidden sm:inline">Run Query</span>
            <span className="sm:hidden">Run</span>
          </Button>
          <Button size="sm" variant="outline" className="border-white/10 bg-white/5 hover:bg-white/10 text-white">
            <Save className="w-4 h-4 mr-2" />
            <span className="hidden sm:inline">Save</span>
          </Button>
        </div>

        {/* AI Input Section */}
        <div className="flex-1 max-w-2xl mx-4 md:mx-6 flex justify-center">
          <Dialog open={isAiOpen} onOpenChange={setIsAiOpen}>
            <DialogTrigger asChild>
              <Button variant="ghost" className="relative group bg-[#0f172a] hover:bg-[#1e293b] border border-purple-500/30 text-gray-300 hover:text-white w-full max-w-md justify-start px-4 py-6 overflow-hidden">
                <div className="absolute -inset-0.5 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-lg opacity-20 group-hover:opacity-50 transition duration-500 blur"></div>
                <div className="relative flex items-center gap-3">
                  <Sparkles className="w-5 h-5 text-purple-400 animate-pulse" />
                  <span className="text-sm truncate">Ask AI...</span>
                </div>
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-[#1e293b] border-white/10 text-white sm:max-w-[600px]">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2 text-xl">
                  <Sparkles className="w-5 h-5 text-purple-400" />
                  Generate SQL with AI
                </DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="relative">
                  <textarea
                    placeholder="Describe your query in plain English (e.g., 'Show me top selling products from last month')"
                    className="w-full h-32 bg-[#0f172a] border border-white/10 rounded-lg p-4 text-sm text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50 resize-none font-mono"
                    value={aiPrompt}
                    onChange={(e) => setAiPrompt(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleGenerateSQL();
                      }
                    }}
                  />
                </div>
                <div className="flex justify-end gap-3">
                  <Button variant="ghost" onClick={() => setIsAiOpen(false)} className="text-gray-400 hover:text-white hover:bg-white/5">Cancel</Button>
                  <Button
                    onClick={handleGenerateSQL}
                    disabled={isGenerating || !aiPrompt.trim()}
                    className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white border-none hover:opacity-90"
                  >
                    {isGenerating ? (
                      <>
                        <Sparkles className="w-4 h-4 mr-2 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4 mr-2" />
                        Generate Query
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <div className="flex items-center gap-2">
          <Button size="icon" variant="ghost" className="text-gray-400 hover:text-white">
            <Download className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Desktop Layout */}
      <ResizablePanelGroup direction="vertical" className="hidden md:flex flex-1">
        {/* Editor Panel */}
        <ResizablePanel defaultSize={40} minSize={20}>
          <div className="h-full flex flex-col bg-[#0f172a]"> {/* Darker background for editor */}
            <div className="flex-1 flex overflow-hidden relative">
              {/* Line Numbers */}
              <div className="w-12 bg-[#0f172a] border-r border-white/5 flex flex-col items-end py-4 pr-3 select-none text-gray-600 font-mono text-sm leading-6">
                {lineNumbers.map(num => (
                  <div key={num} style={{ height: '24px' }}>{num}</div>
                ))}
              </div>
              {/* Text Area */}
              <div className="flex-1 bg-[#0f172a] overflow-auto relative [&::-webkit-scrollbar]:w-2.5 [&::-webkit-scrollbar]:h-2.5 [&::-webkit-scrollbar-track]:bg-[#0f172a] [&::-webkit-scrollbar-thumb]:bg-[#1e293b] [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-[#334155] transition-colors">
                <Editor
                  value={query}
                  onValueChange={handleQueryChange}
                  highlight={code => Prism.highlight(code, Prism.languages.sql, 'sql')}
                  padding={16}
                  style={{
                    fontFamily: '"JetBrains Mono", "Fira Code", monospace',
                    fontSize: 14,
                    backgroundColor: '#0f172a',
                    color: '#e2e8f0',
                    minHeight: '100%',
                    lineHeight: '24px'
                  }}
                  className={`font-mono ${error ? 'border-b-2 border-red-500' : ''}`}
                  textareaClassName="focus:outline-none"
                />
              </div>
            </div>
            {error && (
              <div className="bg-red-500/10 border-t border-red-500/20 px-4 py-2 flex items-center gap-2 text-red-400 text-sm animate-in slide-in-from-top-2">
                <AlertCircle className="w-4 h-4" />
                <span>{error}</span>
              </div>
            )}
            <div className="h-8 bg-[#1e293b] border-t border-white/5 flex items-center px-4 text-xs text-gray-400 justify-between">
              <span>PostgreSQL 15.2</span>
              <span>Ln {lineNumbers.length}, Col {query.length}</span>
            </div>
          </div>
        </ResizablePanel>

        <ResizableHandle withHandle className="bg-[#1e293b] hover:bg-[#3b82f6] transition-colors h-2 border-y border-white/5" />

        {/* Results Panel */}
        <ResizablePanel defaultSize={60} minSize={20}>
          <div className="h-full bg-[#1B2431] flex flex-col">
            <Tabs defaultValue="table" className="flex-1 flex flex-col" onValueChange={setActiveTab}>
              <div className="flex items-center justify-between px-6 py-3 border-b border-white/5 bg-[#273142]">
                <div className="flex items-center gap-4">
                  <h3 className="text-sm font-semibold text-white">Query Results</h3>
                  <span className="text-xs text-gray-500 bg-black/20 px-2 py-0.5 rounded-full">5 rows in 142ms</span>
                </div>
                <TabsList className="bg-[#1B2431] border border-white/5">
                  <TabsTrigger value="table" className="data-[state=active]:bg-[#3b82f6] data-[state=active]:text-white">
                    <TableIcon className="w-4 h-4 mr-2" />
                    Table
                  </TabsTrigger>
                  <TabsTrigger value="chart" className="data-[state=active]:bg-[#3b82f6] data-[state=active]:text-white">
                    <BarChart3 className="w-4 h-4 mr-2" />
                    Chart
                  </TabsTrigger>
                </TabsList>
              </div>

              <div className="flex-1 overflow-hidden p-0 relative">
                <TabsContent value="table" className="h-full w-full m-0 border-none data-[state=active]:flex flex-col overflow-hidden absolute inset-0">
                  <DataTable data={results} columns={columns} />
                </TabsContent>

                <TabsContent value="chart" className="h-full w-full m-0 p-0 border-none data-[state=active]:flex flex-col absolute inset-0">
                  <div className="h-full w-full overflow-y-auto p-6 [&::-webkit-scrollbar]:w-2.5 [&::-webkit-scrollbar]:h-2.5 [&::-webkit-scrollbar-track]:bg-[#1B2431] [&::-webkit-scrollbar-thumb]:bg-[#273142] [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-[#374151] transition-colors">
                    <div className="flex flex-col gap-6 min-h-[800px] pb-6">
                      {/* Main Chart - Revenue Trend */}
                      <div className="flex-[3] min-h-[350px] bg-[#273142] rounded-xl p-4 border border-white/5 shadow-inner w-full flex flex-col">
                        <h4 className="text-sm font-medium text-gray-400 mb-4 shrink-0">Revenue Trends (6 Months)</h4>
                        <div className="flex-1 min-h-0 w-full">
                          <Line data={lineChartData} options={commonOptions} />
                        </div>
                      </div>

                      {/* Secondary Charts Row */}
                      <div className="flex-[2] min-h-[300px] grid grid-cols-2 gap-6 w-full">
                        {/* Distribution */}
                        <div className="bg-[#273142] rounded-xl p-4 border border-white/5 shadow-inner h-full flex flex-col">
                          <h4 className="text-sm font-medium text-gray-400 mb-4 shrink-0">Revenue Share by Category</h4>
                          <div className="flex-1 min-h-0 w-full relative">
                            <Doughnut data={doughnutChartData} options={doughnutOptions} />
                          </div>
                        </div>

                        {/* Growth */}
                        <div className="bg-[#273142] rounded-xl p-4 border border-white/5 shadow-inner h-full flex flex-col">
                          <h4 className="text-sm font-medium text-gray-400 mb-4 shrink-0">MoM Growth Rate</h4>
                          <div className="flex-1 min-h-0 w-full">
                            <Bar data={barChartData} options={commonOptions} />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </TabsContent>
              </div>
            </Tabs>
          </div>
        </ResizablePanel>
      </ResizablePanelGroup>

      {/* Mobile Layout */}
      <div className="flex md:hidden flex-col flex-1 overflow-y-auto pb-24">
        {/* Mobile Editor */}
        <div className="h-[40vh] flex flex-col bg-[#0f172a] border-b border-white/10 shrink-0">
          <div className="flex-1 flex overflow-hidden relative">
            <div className="w-10 bg-[#0f172a] border-r border-white/5 flex flex-col items-end py-4 pr-2 select-none text-gray-600 font-mono text-xs leading-6">
              {lineNumbers.map(num => (
                <div key={num} style={{ height: '24px' }}>{num}</div>
              ))}
            </div>
            <div className="flex-1 bg-[#0f172a] overflow-auto">
              <Editor
                value={query}
                onValueChange={handleQueryChange}
                highlight={code => Prism.highlight(code, Prism.languages.sql, 'sql')}
                padding={16}
                style={{
                  fontFamily: '"JetBrains Mono", "Fira Code", monospace',
                  fontSize: 14,
                  backgroundColor: '#0f172a',
                  color: '#e2e8f0',
                  minHeight: '100%',
                  lineHeight: '24px'
                }}
                className={`font-mono ${error ? 'border-b-2 border-red-500' : ''}`}
                textareaClassName="focus:outline-none"
              />
            </div>
          </div>
          {error && (
            <div className="bg-red-500/10 border-t border-red-500/20 px-4 py-2 flex items-center gap-2 text-red-400 text-xs">
              <AlertCircle className="w-3 h-3" />
              <span>{error}</span>
            </div>
          )}
        </div>

        {/* Mobile Results */}
        <div className="flex-1 min-h-[50vh] bg-[#1B2431] flex flex-col">
          <Tabs defaultValue="table" className="flex-1 flex flex-col" onValueChange={setActiveTab}>
            <div className="flex items-center justify-between px-4 py-3 border-b border-white/5 bg-[#273142]">
              <h3 className="text-sm font-semibold text-white">Results</h3>
              <TabsList className="bg-[#1B2431] border border-white/5 h-8">
                <TabsTrigger value="table" className="text-xs h-7 data-[state=active]:bg-[#3b82f6] data-[state=active]:text-white">
                  <TableIcon className="w-3 h-3 mr-1" />
                  Table
                </TabsTrigger>
                <TabsTrigger value="chart" className="text-xs h-7 data-[state=active]:bg-[#3b82f6] data-[state=active]:text-white">
                  <BarChart3 className="w-3 h-3 mr-1" />
                  Chart
                </TabsTrigger>
              </TabsList>
            </div>

            <div className="flex-1 overflow-hidden p-0 relative">
              <TabsContent value="table" className="h-full w-full m-0 border-none data-[state=active]:flex flex-col overflow-hidden absolute inset-0">
                <DataTable data={results} columns={columns} />
              </TabsContent>

              <TabsContent value="chart" className="h-full w-full m-0 p-0 border-none data-[state=active]:flex flex-col absolute inset-0">
                <div className="h-full w-full overflow-y-auto p-4">
                  <div className="flex flex-col gap-4 pb-4">
                    <div className="bg-[#273142] rounded-xl p-3 border border-white/5 shadow-inner w-full h-[300px] flex flex-col">
                      <h4 className="text-xs font-medium text-gray-400 mb-2">Revenue Trends</h4>
                      <div className="flex-1 min-h-0 w-full">
                        <Line data={lineChartData} options={commonOptions} />
                      </div>
                    </div>
                    <div className="bg-[#273142] rounded-xl p-3 border border-white/5 shadow-inner w-full h-[300px] flex flex-col">
                      <h4 className="text-xs font-medium text-gray-400 mb-2">Revenue Share</h4>
                      <div className="flex-1 min-h-0 w-full relative">
                        <Doughnut data={doughnutChartData} options={doughnutOptions} />
                      </div>
                    </div>
                  </div>
                </div>
              </TabsContent>
            </div>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
