import { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Play, Sparkles, Save, Download, BarChart3, Table as TableIcon, ChevronRight, ChevronLeft, AlertCircle, ArrowUpDown, Filter, MoreHorizontal, ChevronDown } from 'lucide-react';
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '@/components/ui/resizable';
import { TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Parser } from 'node-sql-parser';
import Editor from 'react-simple-code-editor';
import Prism from '@/lib/prism-setup';
import 'prismjs/components/prism-sql';
import 'prismjs/themes/prism-tomorrow.css'; // Dark theme

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

export default function SQLEditor() {
  const [query, setQuery] = useState(`WITH monthly_stats AS (
  SELECT 
    DATE_TRUNC('month', created_at) as month,
    p.category,
    COUNT(o.id) as total_orders,
    SUM(o.amount) as revenue
  FROM orders o
  JOIN products p ON o.product_id = p.id
  WHERE o.status = 'completed'
  GROUP BY 1, 2
)
SELECT 
  month,
  category,
  revenue,
  total_orders,
  ROUND((revenue / NULLIF(LAG(revenue) OVER (PARTITION BY category ORDER BY month), 0) - 1) * 100, 1) as growth_rate
FROM monthly_stats
ORDER BY month DESC, revenue DESC
LIMIT 100;`);
  const [aiPrompt, setAiPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isAiOpen, setIsAiOpen] = useState(false);
  const [, setActiveTab] = useState('table');
  const [error, setError] = useState<string | null>(null);

  const parser = new Parser();

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

  // Enhanced Mock Data Generation
  const generateMockData = (count: number) => {
    return Array.from({ length: count }).map((_, i) => ({
      id: i + 1,
      month: '2024-03-01',
      category: ['Electronics', 'Fashion', 'Home', 'Sports', 'Books'][Math.floor(Math.random() * 5)],
      revenue: Math.floor(Math.random() * 100000) + 10000,
      total_orders: Math.floor(Math.random() * 1000) + 50,
      growth_rate: Number((Math.random() * 20 - 5).toFixed(1))
    }));
  };

  const [results] = useState(generateMockData(55));
  const [sortConfig, setSortConfig] = useState<{ key: string | null; direction: 'asc' | 'desc' }>({ key: null, direction: 'asc' });
  const [filters, setFilters] = useState<{ [key: string]: string }>({});
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const handleSort = (key: string) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const handleFilter = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setCurrentPage(1);
  };

  const processedResults = useMemo(() => {
    let data = [...results];

    // Filtering
    Object.keys(filters).forEach(key => {
      if (filters[key]) {
        data = data.filter(item =>
          String(item[key as keyof typeof item]).toLowerCase().includes(filters[key].toLowerCase())
        );
      }
    });

    // Sorting
    if (sortConfig.key) {
      data.sort((a, b) => {
        const aValue = a[sortConfig.key as keyof typeof a];
        const bValue = b[sortConfig.key as keyof typeof b];
        if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }

    return data;
  }, [results, filters, sortConfig]);

  const totalPages = Math.ceil(processedResults.length / itemsPerPage);
  const paginatedData = processedResults.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

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
    // Otherwise success (no-op for mock)
    console.log('Running query:', query);
  };

  // Line numbers generator
  const lineNumbers = query.split('\n').map((_, i) => i + 1);

  return (
    <div className="h-screen flex flex-col bg-[#1B2431]">
      {/* Toolbar */}
      <div className="h-16 border-b border-white/5 flex items-center justify-between px-6 bg-[#1B2431]">
        <div className="flex items-center gap-3">
          <Button
            size="sm"
            className="bg-[#10b981] hover:bg-[#059669] text-white shadow-lg shadow-green-500/20 transition-all hover:scale-105"
            onClick={handleRunQuery}
          >
            <Play className="w-4 h-4 mr-2" />
            Run Query
          </Button>
          <Button size="sm" variant="outline" className="border-white/10 bg-white/5 hover:bg-white/10 text-white">
            <Save className="w-4 h-4 mr-2" />
            Save
          </Button>
        </div>

        {/* AI Input Section */}
        <div className="flex-1 max-w-2xl mx-6 flex justify-center">
          <Dialog open={isAiOpen} onOpenChange={setIsAiOpen}>
            <DialogTrigger asChild>
              <Button variant="ghost" className="relative group bg-[#0f172a] hover:bg-[#1e293b] border border-purple-500/30 text-gray-300 hover:text-white w-full max-w-md justify-start px-4 py-6 overflow-hidden">
                <div className="absolute -inset-0.5 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-lg opacity-20 group-hover:opacity-50 transition duration-500 blur"></div>
                <div className="relative flex items-center gap-3">
                  <Sparkles className="w-5 h-5 text-purple-400 animate-pulse" />
                  <span className="text-sm">Ask AI to generate SQL...</span>
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

      {/* Editor & Results */}
      <ResizablePanelGroup direction="vertical" className="flex-1">
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
                  <div className="flex-1 overflow-auto w-full [&::-webkit-scrollbar]:w-2.5 [&::-webkit-scrollbar]:h-2.5 [&::-webkit-scrollbar-track]:bg-[#1B2431] [&::-webkit-scrollbar-thumb]:bg-[#273142] [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-[#374151] transition-colors">
                    <table className="w-full caption-bottom text-sm text-left border-collapse min-w-[800px]">
                      <TableHeader className="bg-[#273142] sticky top-0 z-10 shadow-sm">
                        <TableRow className="border-b border-white/5 hover:bg-[#273142]">
                          {['Month', 'Category', 'Revenue', 'Orders', 'Growth'].map((header, index) => {
                            const key = header.toLowerCase().replace(' ', '_');
                            const mapKey = header === 'Orders' ? 'total_orders' : header === 'Growth' ? 'growth_rate' : key;

                            return (
                              <TableHead key={header} className={`h-10 font-medium text-gray-400 ${index > 1 ? 'text-right' : ''}`}>
                                <div className={`flex items-center gap-2 ${index > 1 ? 'justify-end' : 'justify-between'}`}>
                                  <span>{header}</span>
                                  <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0 hover:bg-white/10 data-[state=open]:bg-white/10">
                                        {sortConfig.key === mapKey ? (
                                          <ArrowUpDown className={`h-3 w-3 ${sortConfig.direction === 'asc' ? 'text-blue-400' : 'text-green-400'}`} />
                                        ) : (
                                          <MoreHorizontal className="h-3 w-3" />
                                        )}
                                      </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end" className="w-48 bg-[#1e293b] border-white/10 text-gray-200">
                                      <DropdownMenuLabel>Options</DropdownMenuLabel>
                                      <DropdownMenuSeparator className="bg-white/10" />
                                      <DropdownMenuItem onClick={() => handleSort(mapKey)} className="focus:bg-white/10 focus:text-white cursor-pointer">
                                        <ArrowUpDown className="mr-2 h-3.5 w-3.5 text-gray-400" />
                                        Sort {sortConfig.key === mapKey && sortConfig.direction === 'asc' ? 'Desc' : 'Asc'}
                                      </DropdownMenuItem>
                                      <DropdownMenuSeparator className="bg-white/10" />
                                      <div className="p-2">
                                        <Input
                                          placeholder="Filter..."
                                          className="h-8 bg-[#0f172a] border-white/10 text-xs"
                                          value={filters[mapKey] || ''}
                                          onChange={(e) => handleFilter(mapKey, e.target.value)}
                                        />
                                      </div>
                                    </DropdownMenuContent>
                                  </DropdownMenu>
                                </div>
                              </TableHead>
                            );
                          })}
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {paginatedData.map((row) => (
                          <TableRow key={row.id} className="border-b border-white/5 hover:bg-white/5 transition-colors group">
                            <TableCell className="text-gray-300 font-mono text-xs border-r border-white/5">{row.month}</TableCell>
                            <TableCell className="text-white font-medium border-r border-white/5">{row.category}</TableCell>
                            <TableCell className="text-gray-300 text-right font-mono border-r border-white/5">${row.revenue.toLocaleString()}</TableCell>
                            <TableCell className="text-gray-300 text-right font-mono border-r border-white/5">{row.total_orders}</TableCell>
                            <TableCell className={`text-right font-mono ${row.growth_rate >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                              {row.growth_rate > 0 ? '+' : ''}{row.growth_rate}%
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </table>
                  </div>

                  {/* Pagination Footer */}
                  <div className="h-14 shrink-0 border-t border-white/5 bg-[#273142] flex items-center justify-between px-4 z-20">
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-400">Rows per page</span>
                        <Select value={String(itemsPerPage)} onValueChange={(v) => setItemsPerPage(Number(v))}>
                          <SelectTrigger className="h-8 w-[70px] bg-[#1B2431] border-white/10 text-xs">
                            <SelectValue placeholder={itemsPerPage} />
                          </SelectTrigger>
                          <SelectContent className="bg-[#1B2431] border-white/10 text-gray-200">
                            {[10, 20, 50, 100].map(pageSize => (
                              <SelectItem key={pageSize} value={String(pageSize)} className="focus:bg-white/10 focus:text-white">{pageSize}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="text-xs text-gray-500">
                        Showing {(currentPage - 1) * itemsPerPage + 1}-{Math.min(currentPage * itemsPerPage, processedResults.length)} of {processedResults.length} results
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 text-gray-400 hover:text-white disabled:opacity-50"
                        disabled={currentPage === 1}
                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </Button>
                      <div className="text-xs text-gray-400 font-medium">
                        Page {currentPage} of {totalPages}
                      </div>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 text-gray-400 hover:text-white disabled:opacity-50"
                        disabled={currentPage === totalPages}
                        onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                      >
                        <ChevronRight className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
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
    </div>
  );
}
