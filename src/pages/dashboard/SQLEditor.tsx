import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Play, Sparkles, Save, Download, BarChart3, Table as TableIcon, ChevronRight, ChevronLeft, AlertCircle } from 'lucide-react';
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '@/components/ui/resizable';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
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
} from 'chart.js';
import { Bar } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

export default function SQLEditor() {
  const [query, setQuery] = useState('SELECT category, SUM(sales) as total_sales, AVG(growth) as avg_growth\nFROM sales_data\nGROUP BY category\nORDER BY total_sales DESC\nLIMIT 5;');
  const [aiPrompt, setAiPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
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

  // Mock Result Data
  const results = [
    { id: 1, category: 'Electronics', total_sales: 125000, avg_growth: 12.5, status: 'Active' },
    { id: 2, category: 'Fashion', total_sales: 98000, avg_growth: 8.2, status: 'Active' },
    { id: 3, category: 'Home & Garden', total_sales: 85000, avg_growth: 5.4, status: 'Pending' },
    { id: 4, category: 'Sports', total_sales: 62000, avg_growth: 15.1, status: 'Active' },
    { id: 5, category: 'Books', total_sales: 45000, avg_growth: 2.1, status: 'Inactive' },
  ];

  const chartData = {
    labels: results.map(r => r.category),
    datasets: [
      {
        label: 'Total Sales ($)',
        data: results.map(r => r.total_sales),
        backgroundColor: 'rgba(59, 130, 246, 0.8)', // Blue
        borderRadius: 4,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
        labels: { color: '#9ca3af' }
      },
      title: {
        display: false,
      },
    },
    scales: {
      y: {
        grid: { color: 'rgba(255, 255, 255, 0.05)' },
        ticks: { color: '#9ca3af' },
      },
      x: {
        grid: { display: false },
        ticks: { color: '#9ca3af' },
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
        <div className="flex-1 max-w-2xl mx-6">
          <div className="relative group">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-lg opacity-30 group-hover:opacity-100 transition duration-500 blur"></div>
            <div className="relative flex items-center bg-[#0f172a] rounded-lg p-1">
              <Sparkles className="w-5 h-5 text-purple-400 ml-3 animate-pulse" />
              <input
                type="text"
                placeholder="Ask AI to generate SQL (e.g., 'Show me top selling products')"
                className="flex-1 bg-transparent border-none outline-none text-sm text-white px-3 py-2 placeholder:text-gray-500"
                value={aiPrompt}
                onChange={(e) => setAiPrompt(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleGenerateSQL()}
              />
              <Button
                size="sm"
                onClick={handleGenerateSQL}
                disabled={isGenerating}
                className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 hover:opacity-90 text-white border-none shadow-lg"
              >
                {isGenerating ? 'Generating...' : 'Generate SQL'}
              </Button>
            </div>
          </div>
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
              <div className="flex-1 bg-[#0f172a] overflow-auto relative">
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

        <ResizableHandle className="bg-[#273142] hover:bg-[#3b82f6] transition-colors h-1.5" />

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

              <div className="flex-1 overflow-hidden p-0">
                <TabsContent value="table" className="h-full m-0 border-none data-[state=active]:flex flex-col">
                  <div className="flex-1 overflow-auto">
                    <Table>
                      <TableHeader className="bg-[#273142] sticky top-0 z-10">
                        <TableRow className="border-b border-white/5 hover:bg-[#273142]">
                          <TableHead className="text-gray-400 font-medium h-10">ID</TableHead>
                          <TableHead className="text-gray-400 font-medium h-10">Category</TableHead>
                          <TableHead className="text-gray-400 font-medium h-10 text-right">Total Sales</TableHead>
                          <TableHead className="text-gray-400 font-medium h-10 text-right">Avg Growth (%)</TableHead>
                          <TableHead className="text-gray-400 font-medium h-10">Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {results.map((row) => (
                          <TableRow key={row.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                            <TableCell className="text-gray-300 font-mono text-xs">{row.id}</TableCell>
                            <TableCell className="text-white font-medium">{row.category}</TableCell>
                            <TableCell className="text-gray-300 text-right font-mono">${row.total_sales.toLocaleString()}</TableCell>
                            <TableCell className="text-green-400 text-right font-mono">+{row.avg_growth}%</TableCell>
                            <TableCell>
                              <span className={`px-2 py-1 rounded-full text-[10px] font-medium ${row.status === 'Active' ? 'bg-green-500/10 text-green-500' :
                                row.status === 'Pending' ? 'bg-yellow-500/10 text-yellow-500' :
                                  'bg-red-500/10 text-red-500'
                                }`}>
                                {row.status}
                              </span>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                  {/* Table Footer / Pagination */}
                  <div className="h-12 border-t border-white/5 bg-[#273142] flex items-center justify-between px-4">
                    <div className="text-xs text-gray-500">Showing 1-5 of 5 results</div>
                    <div className="flex items-center gap-2">
                      <Button size="icon" variant="ghost" className="h-8 w-8 text-gray-400 hover:text-white disabled:opacity-50" disabled>
                        <ChevronLeft className="w-4 h-4" />
                      </Button>
                      <Button size="icon" variant="ghost" className="h-8 w-8 text-gray-400 hover:text-white disabled:opacity-50" disabled>
                        <ChevronRight className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="chart" className="h-full m-0 p-6">
                  <div className="h-full w-full bg-[#273142] rounded-xl p-4 border border-white/5 shadow-inner">
                    <Bar data={chartData} options={chartOptions} />
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
